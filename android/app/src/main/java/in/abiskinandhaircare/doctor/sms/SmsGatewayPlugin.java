package in.abiskinandhaircare.doctor.sms;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.firebase.messaging.FirebaseMessaging;

/** JavaScript bridge used by the doctor dashboard's "SMS phone" tab. */
@CapacitorPlugin(name = "SmsGateway", permissions = { @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS }) })
public class SmsGatewayPlugin extends Plugin {

    @Override
    public void load() {
        // Repairs a registration saved without a token (or with an old one) each time the app starts.
        if (new SmsGatewayStore(getContext()).isConfigured()) syncPushToken(getContext());
    }

    /**
     * Sends this phone's Firebase token to the server so SMS jobs wake it instantly. Silent data
     * messages need no notification permission, so this does not wait for the doctor-alert setup.
     */
    private static void syncPushToken(Context context) {
        Context app = context.getApplicationContext();
        try {
            FirebaseMessaging.getInstance().getToken().addOnSuccessListener((token) -> new Thread(() -> {
                SmsGatewayStore store = new SmsGatewayStore(app);
                if (!store.isConfigured()) return;
                try {
                    new SmsGatewayApi(store.getApiBase(), store.getSecret()).updatePushToken(token);
                } catch (Exception ignored) {
                    // The 15-minute poll keeps SMS flowing until the next app start retries this.
                }
            }, "abi-sms-token").start());
        } catch (IllegalStateException firebaseMissing) {
            // Built without google-services.json: no instant wake-up, polling still works.
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context context = getContext();
        SmsGatewayStore store = new SmsGatewayStore(context);
        PowerManager power = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        JSObject result = new JSObject();
        result.put("canSendSms", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY));
        result.put("permission", getPermissionState("sms") == PermissionState.GRANTED);
        result.put("registered", store.isConfigured());
        result.put("batteryUnrestricted", power != null && power.isIgnoringBatteryOptimizations(context.getPackageName()));
        result.put("deviceName", Build.MANUFACTURER + " " + Build.MODEL);
        call.resolve(result);
    }

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            resolvePermission(call);
        } else {
            requestPermissionForAlias("sms", call, "smsPermissionResult");
        }
    }

    @PermissionCallback
    private void smsPermissionResult(PluginCall call) {
        resolvePermission(call);
    }

    private void resolvePermission(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("sms") == PermissionState.GRANTED);
        call.resolve(result);
    }

    /** Stores the server address and this phone's sender secret, then starts sending. */
    @PluginMethod
    public void configure(PluginCall call) {
        String apiBase = call.getString("apiBase");
        String secret = call.getString("secret");
        if (apiBase == null || !(apiBase.startsWith("https://") || apiBase.startsWith("http://localhost")) || secret == null || secret.length() < 32) {
            call.reject("A valid server address and sender secret are required.");
            return;
        }
        new SmsGatewayStore(getContext()).configure(apiBase.replaceAll("/+$", ""), secret);
        SmsGateway.schedulePolling(getContext());
        SmsGateway.processInBackground(getContext());
        syncPushToken(getContext());
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        new SmsGatewayStore(getContext()).clear();
        SmsGateway.cancelPolling(getContext());
        call.resolve();
    }

    /** Checks the server for queued SMS now (called when the dashboard opens or refreshes). */
    @PluginMethod
    public void processNow(PluginCall call) {
        if (new SmsGatewayStore(getContext()).isConfigured()) SmsGateway.processInBackground(getContext());
        call.resolve();
    }

    /** Opens Android's battery optimisation list so the clinic can let ABI Doctor run in the background. */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /** Opens ABI Doctor's app settings: the only way back once SMS permission was denied twice. */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
