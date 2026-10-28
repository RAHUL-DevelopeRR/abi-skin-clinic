package in.abiskinandhaircare.doctor.video;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Sends a video to the clinic server in fixed-size parts (R2 multipart upload). Each part is
 * retried on network errors, so a weak clinic connection does not restart the whole upload.
 */
final class VideoPartUploader {

    interface Progress {
        void onPart(long uploadedBytes);
    }

    static final class UploadException extends IOException {
        UploadException(String message) {
            super(message);
        }
    }

    private static final int ATTEMPTS = 4;

    private VideoPartUploader() {}

    /** Uploads everything in {@code input} to {@code partsUrl}/1, /2, … and returns each part's ETag. */
    static JSONArray upload(InputStream input, String partsUrl, String token, int partSize, Progress progress)
        throws IOException, InterruptedException {
        JSONArray parts = new JSONArray();
        byte[] buffer = new byte[partSize];
        long uploaded = 0;
        for (int partNumber = 1; ; partNumber++) {
            int length = readFully(input, buffer);
            if (length == 0) break;
            String etag = putWithRetry(partsUrl + "/" + partNumber, token, buffer, length);
            try {
                parts.put(new JSONObject().put("partNumber", partNumber).put("etag", etag));
            } catch (org.json.JSONException impossible) {
                throw new IOException(impossible);
            }
            uploaded += length;
            progress.onPart(uploaded);
            if (length < partSize) break;
        }
        return parts;
    }

    private static int readFully(InputStream input, byte[] buffer) throws IOException {
        int total = 0;
        while (total < buffer.length) {
            int read = input.read(buffer, total, buffer.length - total);
            if (read < 0) break;
            total += read;
        }
        return total;
    }

    private static String putWithRetry(String url, String token, byte[] body, int length)
        throws IOException, InterruptedException {
        IOException last = null;
        for (int attempt = 1; attempt <= ATTEMPTS; attempt++) {
            try {
                return put(url, token, body, length);
            } catch (UploadException rejected) {
                throw rejected;
            } catch (IOException networkError) {
                last = networkError;
                Thread.sleep(2_000L * attempt);
            }
        }
        throw new IOException("Upload kept failing. Check the internet connection and try again.", last);
    }

    private static String put(String url, String token, byte[] body, int length) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        try {
            connection.setRequestMethod("PUT");
            connection.setConnectTimeout(20_000);
            connection.setReadTimeout(120_000);
            connection.setDoOutput(true);
            connection.setFixedLengthStreamingMode(length);
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setRequestProperty("Content-Type", "application/octet-stream");
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body, 0, length);
            }
            int status = connection.getResponseCode();
            String response = readBody(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
            if (status >= 500 || status == 408 || status == 429) throw new IOException("Server busy (" + status + ").");
            if (status >= 400) throw new UploadException(errorMessage(response, status));
            String etag = new JSONObject(response).optString("etag");
            if (etag.isEmpty()) throw new IOException("The server did not confirm the part.");
            return etag;
        } catch (org.json.JSONException badResponse) {
            throw new IOException("Unexpected server response.", badResponse);
        } finally {
            connection.disconnect();
        }
    }

    private static String errorMessage(String response, int status) {
        try {
            String message = new JSONObject(response).getJSONObject("error").optString("message");
            if (!message.isEmpty()) return message;
        } catch (Exception ignored) {
            // Fall through to a generic message.
        }
        return "The server refused the upload (" + status + ").";
    }

    private static String readBody(InputStream stream) throws IOException {
        if (stream == null) return "";
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] chunk = new byte[4096];
            int read;
            while ((read = input.read(chunk)) != -1) output.write(chunk, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }
}
