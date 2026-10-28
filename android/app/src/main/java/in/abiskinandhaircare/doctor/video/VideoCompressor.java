package in.abiskinandhaircare.doctor.video;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.OptIn;
import androidx.media3.common.Effect;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.effect.Presentation;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.DefaultEncoderFactory;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.EditedMediaItemSequence;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ExportException;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.ProgressHolder;
import androidx.media3.transformer.Transformer;
import androidx.media3.transformer.VideoEncoderSettings;
import java.io.File;
import java.util.Collections;
import java.util.UUID;

/**
 * Re-encodes a video to an H.264 MP4 under the upload limit using the phone's hardware encoder.
 * The bitrate is worked out from the video's length; if the result is still too big, it tries
 * again with less bitrate.
 */
@OptIn(markerClass = UnstableApi.class)
final class VideoCompressor {

    interface Listener {
        void onProgress(int percent);

        void onDone(File output);

        void onError(String message);
    }

    /** Room for AAC audio and the MP4 container on top of the video stream. */
    static final long AUDIO_BITRATE = 160_000;
    /** Encoders overshoot their target a little, so aim below the limit. */
    private static final double HEADROOM = 0.92;
    private static final double[] BUDGET_PER_ATTEMPT = { 1.0, 0.8, 0.6 };

    /** Output size and bitrate for one attempt; null when the video is too long to fit at all. */
    static final class Plan {
        final int width;
        final int height;
        final long videoBitrate;
        final boolean scaled;

        Plan(int width, int height, long videoBitrate, boolean scaled) {
            this.width = width;
            this.height = height;
            this.videoBitrate = videoBitrate;
            this.scaled = scaled;
        }
    }

    private VideoCompressor() {}

    static Plan plan(VideoInfo info, long maxBytes, double budget) {
        double seconds = Math.max(info.durationMs / 1000.0, 1);
        long videoBitrate = (long) (maxBytes * HEADROOM * budget * 8 / seconds) - AUDIO_BITRATE;
        int targetShortSide;
        long cap;
        if (videoBitrate >= 4_000_000) {
            targetShortSide = 1080;
            cap = 8_000_000;
        } else if (videoBitrate >= 1_500_000) {
            targetShortSide = 720;
            cap = 4_000_000;
        } else if (videoBitrate >= 700_000) {
            targetShortSide = 480;
            cap = 1_500_000;
        } else if (videoBitrate >= 300_000) {
            targetShortSide = 360;
            cap = 700_000;
        } else {
            return null;
        }
        videoBitrate = Math.min(videoBitrate, cap);
        // H.264 needs about 1.5x the bitrate of the HEVC most phones record; more is wasted space.
        if (info.bitrate > 0) videoBitrate = Math.min(videoBitrate, Math.max((long) (info.bitrate * 1.5), 300_000));

        int displayWidth = Math.max(info.displayWidth(), 2);
        int displayHeight = Math.max(info.displayHeight(), 2);
        int shortSide = Math.min(displayWidth, displayHeight);
        if (shortSide <= targetShortSide) return new Plan(displayWidth, displayHeight, videoBitrate, false);
        double scale = (double) targetShortSide / shortSide;
        return new Plan(even(displayWidth * scale), even(displayHeight * scale), videoBitrate, true);
    }

    /** Longest video, in whole minutes, that still fits under the limit at the lowest quality. */
    static long maxMinutes(long maxBytes) {
        return (long) (maxBytes * HEADROOM * BUDGET_PER_ATTEMPT[BUDGET_PER_ATTEMPT.length - 1] * 8
            / (300_000 + AUDIO_BITRATE) / 60);
    }

    static File outputDir(Context context) {
        File dir = new File(context.getCacheDir(), "video-uploads");
        if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Cannot create " + dir);
        return dir;
    }

    /** Transformer needs a Looper, so every attempt runs on the main thread. */
    static void compress(Context context, Uri uri, VideoInfo info, long maxBytes, Listener listener) {
        Context app = context.getApplicationContext();
        new Handler(Looper.getMainLooper()).post(() -> attempt(app, uri, info, maxBytes, 0, listener));
    }

    private static void attempt(Context context, Uri uri, VideoInfo info, long maxBytes, int round, Listener listener) {
        Plan plan = plan(info, maxBytes, BUDGET_PER_ATTEMPT[round]);
        if (plan == null) {
            listener.onError("This video is too long to fit under 100 MB. Trim it to under "
                + maxMinutes(maxBytes) + " minutes and try again.");
            return;
        }
        File output = new File(outputDir(context), UUID.randomUUID() + ".mp4");
        Handler handler = new Handler(Looper.getMainLooper());
        ProgressHolder progress = new ProgressHolder();
        Transformer[] running = new Transformer[1];
        Runnable poll = new Runnable() {
            @Override
            public void run() {
                if (running[0] == null) return;
                if (running[0].getProgress(progress) == Transformer.PROGRESS_STATE_AVAILABLE) {
                    listener.onProgress(progress.progress);
                }
                handler.postDelayed(this, 500);
            }
        };

        Transformer transformer = new Transformer.Builder(context)
            .setVideoMimeType(MimeTypes.VIDEO_H264)
            .setAudioMimeType(MimeTypes.AUDIO_AAC)
            .setEncoderFactory(new DefaultEncoderFactory.Builder(context)
                .setRequestedVideoEncoderSettings(new VideoEncoderSettings.Builder()
                    .setBitrate((int) plan.videoBitrate)
                    .build())
                .setEnableFallback(true)
                .build())
            .addListener(new Transformer.Listener() {
                @Override
                public void onCompleted(Composition composition, ExportResult result) {
                    running[0] = null;
                    handler.removeCallbacks(poll);
                    if (result.videoMimeType != null && !MimeTypes.VIDEO_H264.equals(result.videoMimeType)) {
                        deleteQuietly(output);
                        listener.onError("This phone could not convert the video to a format every browser plays.");
                        return;
                    }
                    if (output.length() > 0 && output.length() <= maxBytes) {
                        listener.onDone(output);
                        return;
                    }
                    deleteQuietly(output);
                    if (round + 1 < BUDGET_PER_ATTEMPT.length) {
                        attempt(context, uri, info, maxBytes, round + 1, listener);
                    } else {
                        listener.onError("Could not compress this video under 100 MB. Trim it and try again.");
                    }
                }

                @Override
                public void onError(Composition composition, ExportResult result, ExportException exception) {
                    running[0] = null;
                    handler.removeCallbacks(poll);
                    deleteQuietly(output);
                    listener.onError("This phone could not compress the video (" + exception.getErrorCodeName() + ").");
                }
            })
            .build();

        EditedMediaItem.Builder item = new EditedMediaItem.Builder(MediaItem.fromUri(uri));
        if (plan.scaled) {
            item.setEffects(new Effects(
                Collections.emptyList(),
                Collections.<Effect>singletonList(
                    Presentation.createForWidthAndHeight(plan.width, plan.height, Presentation.LAYOUT_SCALE_TO_FIT))));
        }
        // HDR recordings would otherwise stay HDR as 10-bit HEVC, which many browsers cannot play;
        // tone-map them to ordinary H.264. SDR videos are unaffected.
        Composition composition = new Composition.Builder(new EditedMediaItemSequence.Builder(item.build()).build())
            .setHdrMode(Composition.HDR_MODE_TONE_MAP_HDR_TO_SDR_USING_OPEN_GL)
            .build();
        running[0] = transformer;
        transformer.start(composition, output.getAbsolutePath());
        handler.post(poll);
    }

    private static int even(double value) {
        return Math.max(2, ((int) Math.round(value)) & ~1);
    }

    static void deleteQuietly(File file) {
        if (file != null && file.exists() && !file.delete()) file.deleteOnExit();
    }
}
