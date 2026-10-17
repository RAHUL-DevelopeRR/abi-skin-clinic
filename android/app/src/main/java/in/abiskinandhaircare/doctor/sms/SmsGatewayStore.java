package in.abiskinandhaircare.doctor.sms;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Private storage for the SMS gateway: the server address, this phone's sender secret,
 * status reports that could not reach the server yet, and recently sent job IDs (so a
 * job the server offers again is never texted to the patient twice).
 */
final class SmsGatewayStore {

    private static final String PREFS = "abi_sms_gateway";
    private static final String KEY_API_BASE = "api_base";
    private static final String KEY_SECRET = "secret";
    private static final String KEY_PENDING_REPORTS = "pending_reports";
    private static final String KEY_SENT_JOBS = "sent_jobs";
    private static final int MAX_SENT_JOBS = 300;

    private final SharedPreferences prefs;

    SmsGatewayStore(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    boolean isConfigured() {
        return getApiBase() != null && getSecret() != null;
    }

    String getApiBase() {
        return prefs.getString(KEY_API_BASE, null);
    }

    String getSecret() {
        return prefs.getString(KEY_SECRET, null);
    }

    void configure(String apiBase, String secret) {
        prefs.edit().putString(KEY_API_BASE, apiBase).putString(KEY_SECRET, secret).remove(KEY_PENDING_REPORTS).apply();
    }

    void clear() {
        prefs.edit().clear().apply();
    }

    synchronized void addPendingReport(String jobId, String status, String error) {
        JSONArray reports = readArray(KEY_PENDING_REPORTS);
        try {
            JSONObject report = new JSONObject().put("id", jobId).put("status", status);
            if (error != null) report.put("error", error);
            reports.put(report);
        } catch (JSONException ignored) {
            return;
        }
        prefs.edit().putString(KEY_PENDING_REPORTS, reports.toString()).apply();
    }

    synchronized List<JSONObject> takePendingReports() {
        JSONArray reports = readArray(KEY_PENDING_REPORTS);
        prefs.edit().remove(KEY_PENDING_REPORTS).apply();
        List<JSONObject> list = new ArrayList<>();
        for (int i = 0; i < reports.length(); i++) {
            JSONObject report = reports.optJSONObject(i);
            if (report != null) list.add(report);
        }
        return list;
    }

    synchronized boolean wasSent(String jobId) {
        JSONArray sent = readArray(KEY_SENT_JOBS);
        for (int i = 0; i < sent.length(); i++) {
            if (jobId.equals(sent.optString(i))) return true;
        }
        return false;
    }

    synchronized void markSent(String jobId) {
        JSONArray sent = readArray(KEY_SENT_JOBS);
        JSONArray trimmed = new JSONArray();
        int start = Math.max(0, sent.length() - (MAX_SENT_JOBS - 1));
        for (int i = start; i < sent.length(); i++) trimmed.put(sent.optString(i));
        trimmed.put(jobId);
        prefs.edit().putString(KEY_SENT_JOBS, trimmed.toString()).apply();
    }

    private JSONArray readArray(String key) {
        try {
            return new JSONArray(prefs.getString(key, "[]"));
        } catch (JSONException error) {
            return new JSONArray();
        }
    }
}
