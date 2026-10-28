package in.abiskinandhaircare.doctor.video;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;

/**
 * JavaScript bridge for the dashboard's "Videos" tab: pick a video, compress it under the
 * limit when needed, and upload it in parts. Large files never pass through the WebView.
 */
@CapacitorPlugin(name = "VideoUploader")
public class VideoUploaderPlugin extends Plugin {

    private static final long DEFAULT_MAX_BYTES = 100_000_000L;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        // Compressed copies left behind by an upload that never finished.
        executor.execute(() -> {
            File[] stale = VideoCompressor.outputDir(getContext()).listFiles();
            if (stale != null) for (File file : stale) VideoCompressor.deleteQuietly(file);
        });
    }

    @PluginMethod
    public void pickVideo(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT)
            .setType("video/*")
            .addCategory(Intent.CATEGORY_OPENABLE);
        startActivityForResult(call, Intent.createChooser(intent, "Choose a video"), "pickResult");
    }

    @ActivityCallback
    private void pickResult(PluginCall call, ActivityResult result) {
        Intent data = result.getData();
        Uri uri = result.getResultCode() == Activity.RESULT_OK && data != null ? data.getData() : null;
        if (uri == null) {
            call.reject("No video was chosen.", "CANCELLED");
            return;
        }
        long maxBytes = maxBytes(call);
        executor.execute(() -> {
            try {
                VideoInfo info = VideoInfo.read(getContext(), uri);
                JSObject picked = new JSObject();
                picked.put("uri", uri.toString());
                picked.put("name", info.name);
                picked.put("sizeBytes", info.sizeBytes);
                picked.put("durationMs", info.durationMs);
                picked.put("width", info.displayWidth());
                picked.put("height", info.displayHeight());
                picked.put("needsCompression", info.needsCompression(maxBytes));
                call.resolve(picked);
            } catch (IOException unreadable) {
                call.reject("This file could not be read as a video.");
            }
        });
    }

    /** Returns something upload() can read: the original video, or a compressed copy under the limit. */
    @PluginMethod
    public void prepare(PluginCall call) {
        String uriText = call.getString("uri");
        if (uriText == null) {
            call.reject("Choose a video first.");
            return;
        }
        Uri uri = Uri.parse(uriText);
        long maxBytes = maxBytes(call);
        executor.execute(() -> {
            VideoInfo info;
            try {
                info = VideoInfo.read(getContext(), uri);
            } catch (IOException unreadable) {
                call.reject("This file could not be read as a video.");
                return;
            }
            if (!info.needsCompression(maxBytes)) {
                JSObject prepared = new JSObject();
                prepared.put("source", uri.toString());
                prepared.put("sizeBytes", info.sizeBytes);
                prepared.put("compressed", false);
                call.resolve(prepared);
                return;
            }
            VideoCompressor.compress(getContext(), uri, info, maxBytes, new VideoCompressor.Listener() {
                @Override
                public void onProgress(int percent) {
                    progress("compressing", percent);
                }

                @Override
                public void onDone(File output) {
                    JSObject prepared = new JSObject();
                    prepared.put("source", Uri.fromFile(output).toString());
                    prepared.put("sizeBytes", output.length());
                    prepared.put("compressed", true);
                    call.resolve(prepared);
                }

                @Override
                public void onError(String message) {
                    call.reject(message);
                }
            });
        });
    }

    @PluginMethod
    public void upload(PluginCall call) {
        String source = call.getString("source");
        String url = call.getString("url");
        String token = call.getString("token");
        int partSize = call.getInt("partSize", 0);
        long sizeBytes = call.getDouble("sizeBytes", 0.0).longValue();
        if (source == null || token == null || partSize < 5 * 1024 * 1024 || !isAllowedUrl(url)) {
            call.reject("Upload details are missing.");
            return;
        }
        executor.execute(() -> {
            try (InputStream input = open(source)) {
                JSONArray parts = VideoPartUploader.upload(input, url, token, partSize, (uploaded) ->
                    progress("uploading", sizeBytes > 0 ? (int) Math.min(100, uploaded * 100 / sizeBytes) : 0));
                JSObject result = new JSObject();
                result.put("parts", parts);
                call.resolve(result);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                call.reject("Upload was interrupted.");
            } catch (IOException | SecurityException failed) {
                call.reject(failed.getMessage() == null ? "Upload failed." : failed.getMessage());
            }
        });
    }

    /** Deletes a compressed copy once it is uploaded (or abandoned). Never touches the doctor's original. */
    @PluginMethod
    public void discard(PluginCall call) {
        String source = call.getString("source");
        executor.execute(() -> {
            File file = ownedFile(source);
            if (file != null) VideoCompressor.deleteQuietly(file);
            call.resolve();
        });
    }

    private void progress(String stage, int percent) {
        JSObject event = new JSObject();
        event.put("stage", stage);
        event.put("percent", percent);
        notifyListeners("progress", event);
    }

    private InputStream open(String source) throws IOException {
        File owned = ownedFile(source);
        if (owned != null) return new FileInputStream(owned);
        Uri uri = Uri.parse(source);
        if (!"content".equals(uri.getScheme())) throw new IOException("Unsupported video location.");
        InputStream input = getContext().getContentResolver().openInputStream(uri);
        if (input == null) throw new IOException("The video could not be opened.");
        return input;
    }

    /** A compressed copy in ABI Doctor's own cache, or null for anything else. */
    private File ownedFile(String source) {
        if (source == null) return null;
        Uri uri = Uri.parse(source);
        if (!"file".equals(uri.getScheme()) || uri.getPath() == null) return null;
        try {
            File file = new File(uri.getPath()).getCanonicalFile();
            File dir = VideoCompressor.outputDir(getContext()).getCanonicalFile();
            return dir.equals(file.getParentFile()) ? file : null;
        } catch (IOException invalid) {
            return null;
        }
    }

    private static boolean isAllowedUrl(String url) {
        return url != null && (url.startsWith("https://") || url.startsWith("http://localhost:"));
    }

    private static long maxBytes(PluginCall call) {
        return call.getDouble("maxBytes", (double) DEFAULT_MAX_BYTES).longValue();
    }
}
