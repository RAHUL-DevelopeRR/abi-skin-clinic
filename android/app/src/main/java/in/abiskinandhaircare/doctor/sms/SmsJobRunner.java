package in.abiskinandhaircare.doctor.sms;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import android.util.Log;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Fetches SMS jobs queued by the clinic server and sends them from this phone's SIM.
 * Called on a Firebase wake-up, by the 15-minute fallback worker and when the app opens.
 */
public final class SmsJobRunner {

    private static final String TAG = "AbiSmsGateway";

    private SmsJobRunner() {}

    /** Runs on the caller's thread; never call it from the main thread. Returns SMS handed to the radio. */
    public static synchronized int run(Context context) {
        Context app = context.getApplicationContext();
        SmsGatewayStore store = new SmsGatewayStore(app);
        if (!store.isConfigured()) return 0;
        String secret = store.getSecret();
        SmsGatewayApi api = new SmsGatewayApi(store.getApiBase(), secret);
        try {
            flushReports(store, api);
            JSONArray jobs = api.getPendingJobs().optJSONArray("jobs");
            if (jobs == null) return 0;
            int handed = 0;
            for (int i = 0; i < jobs.length(); i++) {
                JSONObject job = jobs.getJSONObject(i);
                if (sendJob(app, store, job)) handed++;
            }
            return handed;
        } catch (SmsGatewayApi.UnauthorizedException error) {
            // Re-registering saves a new secret while an old request may still be in flight;
            // its 401 must not erase the new registration.
            if (!secret.equals(store.getSecret())) return 0;
            Log.w(TAG, "Sender registration was removed on the server; stopping.");
            store.clear();
            SmsGateway.cancelPolling(app);
            return 0;
        } catch (Exception error) {
            Log.w(TAG, "Could not process SMS jobs: " + error.getMessage());
            return 0;
        }
    }

    private static boolean sendJob(Context context, SmsGatewayStore store, JSONObject job) {
        String id = job.optString("id");
        String phone = job.optString("phone");
        String message = job.optString("message");
        if (id.isEmpty()) return false;
        if (store.wasSent(id)) {
            // Already handed to the radio earlier; the server just never heard back.
            report(context, id, "sent", null);
            return false;
        }
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            report(context, id, "failed", "SMS permission is off for ABI Doctor on the clinic phone.");
            return false;
        }
        SmsManager smsManager = smsManager(context);
        if (smsManager == null || phone.isEmpty() || message.isEmpty()) {
            report(context, id, "failed", "This phone cannot send SMS.");
            return false;
        }
        try {
            ArrayList<String> parts = smsManager.divideMessage(message);
            ArrayList<PendingIntent> sentIntents = new ArrayList<>();
            ArrayList<PendingIntent> deliveryIntents = new ArrayList<>();
            for (int part = 0; part < parts.size(); part++) {
                boolean last = part == parts.size() - 1;
                sentIntents.add(resultIntent(context, SmsResultReceiver.ACTION_SENT, id, part, last));
                deliveryIntents.add(last ? resultIntent(context, SmsResultReceiver.ACTION_DELIVERED, id, part, true) : null);
            }
            store.markSent(id);
            if (parts.size() == 1) {
                smsManager.sendTextMessage(phone, null, message, sentIntents.get(0), deliveryIntents.get(0));
            } else {
                smsManager.sendMultipartTextMessage(phone, null, parts, sentIntents, deliveryIntents);
            }
            return true;
        } catch (RuntimeException error) {
            report(context, id, "failed", "Phone could not send: " + error.getMessage());
            return false;
        }
    }

    @SuppressWarnings("deprecation")
    private static SmsManager smsManager(Context context) {
        if (!context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) return null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return context.getSystemService(SmsManager.class);
        return SmsManager.getDefault();
    }

    private static PendingIntent resultIntent(Context context, String action, String jobId, int part, boolean last) {
        Intent intent = new Intent(context, SmsResultReceiver.class)
            .setAction(action)
            // A unique data URI keeps each part's PendingIntent distinct.
            .setData(Uri.parse("abi-sms://" + action + "/" + jobId + "/" + part))
            .putExtra(SmsResultReceiver.EXTRA_JOB_ID, jobId)
            .putExtra(SmsResultReceiver.EXTRA_LAST_PART, last);
        // "Sent" fires once. "Delivered" also fires for interim network reports ("still trying"),
        // so it must not be one-shot or the final delivered report would be lost.
        int flags = SmsResultReceiver.ACTION_SENT.equals(action) ? PendingIntent.FLAG_ONE_SHOT : 0;
        // Mutable so the telephony stack can attach the delivery-report PDU.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
        return PendingIntent.getBroadcast(context, 0, intent, flags);
    }

    /** Sends a status report now, or keeps it for the next run if the server is unreachable. */
    static void report(Context context, String jobId, String status, String error) {
        SmsGatewayStore store = new SmsGatewayStore(context);
        if (!store.isConfigured()) return;
        try {
            new SmsGatewayApi(store.getApiBase(), store.getSecret()).report(jobId, status, error);
        } catch (Exception failure) {
            store.addPendingReport(jobId, status, error);
        }
    }

    private static void flushReports(SmsGatewayStore store, SmsGatewayApi api) throws SmsGatewayApi.UnauthorizedException {
        List<JSONObject> reports = store.takePendingReports();
        for (int i = 0; i < reports.size(); i++) {
            JSONObject report = reports.get(i);
            try {
                api.report(report.optString("id"), report.optString("status"), report.has("error") ? report.optString("error") : null);
            } catch (SmsGatewayApi.UnauthorizedException unauthorized) {
                throw unauthorized;
            } catch (Exception error) {
                for (int rest = i; rest < reports.size(); rest++) {
                    JSONObject keep = reports.get(rest);
                    store.addPendingReport(keep.optString("id"), keep.optString("status"), keep.has("error") ? keep.optString("error") : null);
                }
                return;
            }
        }
    }
}
