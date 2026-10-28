package in.abiskinandhaircare.doctor.alerts;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** JavaScript bridge for the dashboard's "Request alerts" card. */
@CapacitorPlugin(name = "AppointmentAlerts")
public class AppointmentAlertsPlugin extends Plugin {

    @PluginMethod
    public void getStatus(PluginCall call) {
        AppointmentAlerts.ensureChannels(getContext());
        JSObject status = new JSObject();
        status.put("ringEnabled", AppointmentAlerts.isRingEnabled(getContext()));
        status.put("notificationsAllowed", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        status.put("fullScreenAllowed", AppointmentAlerts.canUseFullScreen(getContext()));
        call.resolve(status);
    }

    @PluginMethod
    public void setRingEnabled(PluginCall call) {
        AppointmentAlerts.setRingEnabled(getContext(), Boolean.TRUE.equals(call.getBoolean("enabled", true)));
        getStatus(call);
    }

    /** Rings like a real request after a short delay, so the doctor can lock the phone and see it. */
    @PluginMethod
    public void test(PluginCall call) {
        int delaySeconds = Math.max(0, Math.min(call.getInt("delaySeconds", 5), 30));
        new Handler(Looper.getMainLooper()).postDelayed(() -> AppointmentAlerts.ring(getContext(),
            "Test: new appointment request", "This is how ABI Doctor rings for a new request."), delaySeconds * 1000L);
        call.resolve();
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        Intent intent = Build.VERSION.SDK_INT >= 34
            ? new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + getContext().getPackageName()))
            : appNotificationSettings();
        getContext().startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        call.resolve();
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        getContext().startActivity(appNotificationSettings().addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        call.resolve();
    }

    private Intent appNotificationSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        }
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
    }
}
