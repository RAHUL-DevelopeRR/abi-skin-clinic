package in.abiskinandhaircare.doctor.sms;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;
import org.json.JSONObject;

/** Minimal HTTPS client for the clinic server's /api/device endpoints. */
final class SmsGatewayApi {

    /** The server no longer recognises this phone (another phone was registered). */
    static final class UnauthorizedException extends IOException {
        UnauthorizedException() {
            super("This phone is no longer the registered SMS sender.");
        }
    }

    private static final int TIMEOUT_MS = 15_000;

    private final String apiBase;
    private final String secret;

    SmsGatewayApi(String apiBase, String secret) {
        this.apiBase = apiBase;
        this.secret = secret;
    }

    JSONObject getPendingJobs() throws IOException, JSONException {
        return request("GET", "/api/device/sms/pending", null);
    }

    void report(String jobId, String status, String error) throws IOException, JSONException {
        JSONObject body = new JSONObject().put("status", status);
        if (error != null) body.put("error", error);
        request("POST", "/api/device/sms/" + jobId, body);
    }

    void updatePushToken(String token) throws IOException, JSONException {
        request("POST", "/api/device/push-token", new JSONObject().put("token", token));
    }

    private JSONObject request(String method, String path, JSONObject body) throws IOException, JSONException {
        HttpURLConnection connection = (HttpURLConnection) new URL(apiBase + path).openConnection();
        try {
            connection.setRequestMethod(method);
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setRequestProperty("Authorization", "Bearer " + secret);
            connection.setRequestProperty("Accept", "application/json");
            if (body != null) {
                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(bytes);
                }
            }
            int status = connection.getResponseCode();
            if (status == 401) throw new UnauthorizedException();
            InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
            String text = stream == null ? "" : readAll(stream);
            if (status >= 400) throw new IOException("Server returned " + status + ": " + text);
            return text.isEmpty() ? new JSONObject() : new JSONObject(text);
        } finally {
            connection.disconnect();
        }
    }

    private static String readAll(InputStream stream) throws IOException {
        try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }
}
