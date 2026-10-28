package in.abiskinandhaircare.doctor.video;

import android.content.Context;
import android.database.Cursor;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.provider.OpenableColumns;
import java.io.IOException;

/** What ABI Doctor needs to know about a picked video before uploading it. */
final class VideoInfo {

    final String name;
    final long sizeBytes;
    final String containerMime;
    final String videoMime;
    final long durationMs;
    final int width;
    final int height;
    final int rotation;
    final long bitrate;

    private VideoInfo(String name, long sizeBytes, String containerMime, String videoMime,
                      long durationMs, int width, int height, int rotation, long bitrate) {
        this.name = name;
        this.sizeBytes = sizeBytes;
        this.containerMime = containerMime;
        this.videoMime = videoMime;
        this.durationMs = durationMs;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.bitrate = bitrate;
    }

    /** Width as the video is shown, after the phone's rotation flag is applied. */
    int displayWidth() {
        return rotation % 180 == 0 ? width : height;
    }

    int displayHeight() {
        return rotation % 180 == 0 ? height : width;
    }

    /** Uploaded as-is only when it is already a small H.264 MP4, which every browser plays. */
    boolean needsCompression(long maxBytes) {
        return sizeBytes <= 0 || sizeBytes > maxBytes
            || !"video/mp4".equals(containerMime) || !"video/avc".equals(videoMime);
    }

    static VideoInfo read(Context context, Uri uri) throws IOException {
        String name = "video";
        long size = -1;
        try (Cursor cursor = context.getContentResolver().query(
            uri, new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                if (!cursor.isNull(0)) name = cursor.getString(0);
                if (!cursor.isNull(1)) size = cursor.getLong(1);
            }
        }

        String videoMime = null;
        MediaExtractor extractor = new MediaExtractor();
        try {
            extractor.setDataSource(context, uri, null);
            for (int track = 0; track < extractor.getTrackCount(); track++) {
                String mime = extractor.getTrackFormat(track).getString(MediaFormat.KEY_MIME);
                if (mime != null && mime.startsWith("video/")) {
                    videoMime = mime;
                    break;
                }
            }
        } finally {
            extractor.release();
        }
        if (videoMime == null) throw new IOException("No video track.");

        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(context, uri);
            return new VideoInfo(
                name,
                size,
                context.getContentResolver().getType(uri),
                videoMime,
                number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)),
                (int) number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)),
                (int) number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)),
                (int) number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)),
                number(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)));
        } catch (RuntimeException unreadable) {
            throw new IOException("Unreadable video.", unreadable);
        } finally {
            try {
                retriever.release();
            } catch (Exception ignored) {
                // Nothing left to clean up.
            }
        }
    }

    private static long number(String value) {
        try {
            return value == null ? 0 : Long.parseLong(value.trim());
        } catch (NumberFormatException notANumber) {
            return 0;
        }
    }
}
