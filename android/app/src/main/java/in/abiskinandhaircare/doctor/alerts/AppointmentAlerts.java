package in.abiskinandhaircare.doctor.alerts;

import android.app.AppOpsManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import androidx.core.app.NotificationCompat;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import in.abiskinandhaircare.doctor.MainActivity;
import in.abiskinandhaircare.doctor.R;
import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

/**
 * Taxi-app style alert for new appointment requests: a looping ring, vibration and a
 * full-screen card over the lock screen, until the doctor opens ABI Doctor, taps Silence,
 * or a minute passes. After that a quiet "waiting" notification stays in the shade.
 */
public final class AppointmentAlerts {

    static final String RING_CHANNEL = "appointment_ring_v1";
    static final String WAITING_CHANNEL = "appointment_waiting";
    /** Created by the dashboard for plain alerts; used when ringing is turned off. */
    static final String PLAIN_CHANNEL = "appointments";
    static final int RING_ID = 41_001;
    static final int WAITING_ID = 41_002;
    static final long RING_MILLIS = 60_000;
    private static final String TIMEOUT_WORK = "appointment-ring-timeout";
    private static final String PREFS = "abi_appointment_alerts";
    private static final String KEY_RING_ENABLED = "ring_enabled";
    /** A ring was started and has not been answered, silenced or turned into a reminder yet. */
    private static final String KEY_PENDING = "ring_pending";
    private static final String KEY_TITLE = "last_title";
    private static final String KEY_BODY = "last_body";
    private static final long[] VIBRATION = { 0, 900, 500, 900, 500, 900 };

    /** True while the dashboard is on screen (set by MainActivity). */
    public static volatile boolean appInForeground;

    private AppointmentAlerts() {}

    public static boolean isRingEnabled(Context context) {
        return prefs(context).getBoolean(KEY_RING_ENABLED, true);
    }

    static void setRingEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_RING_ENABLED, enabled).apply();
    }

    /** False when the doctor blocked or lowered the ringing channel in Android's settings. */
    static boolean isRingChannelOn(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        ensureChannels(context);
        NotificationChannel channel = notificationManager(context).getNotificationChannel(RING_CHANNEL);
        return channel == null || channel.getImportance() >= NotificationManager.IMPORTANCE_HIGH;
    }

    /** Entry point for a new-request push: rings, or posts a plain notification if ringing is off. */
    public static void onNewRequest(Context context, String title, String body) {
        String safeTitle = title == null || title.isEmpty() ? "New appointment request" : title;
        String safeBody = body == null || body.isEmpty() ? "Open ABI Doctor to review it." : body;
        // A blocked ringing channel would swallow the alert entirely, so fall back to a plain one.
        if (isRingEnabled(context) && isRingChannelOn(context)) {
            ring(context, safeTitle, safeBody);
        } else {
            ensureChannels(context);
            notificationManager(context).notify(WAITING_ID, waiting(context, PLAIN_CHANNEL, safeTitle, safeBody));
        }
    }

    static void ring(Context context, String title, String body) {
        Context app = context.getApplicationContext();
        ensureChannels(app);
        prefs(app).edit().putBoolean(KEY_PENDING, true).putString(KEY_TITLE, title).putString(KEY_BODY, body).apply();

        PendingIntent fullScreen = PendingIntent.getActivity(app, 2,
            new Intent(app, AppointmentAlertActivity.class)
                .putExtra(AppointmentAlertActivity.EXTRA_TITLE, title)
                .putExtra(AppointmentAlertActivity.EXTRA_BODY, body)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(app, RING_CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_appointment)
            .setColor(0xFF0D9488)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openApp(app))
            .setFullScreenIntent(fullScreen, true)
            .setAutoCancel(true)
            .setOngoing(true)
            // The system stops the sound on time even if the reminder job below runs late (Doze).
            .setTimeoutAfter(RING_MILLIS)
            .addAction(0, "Open", openApp(app))
            .addAction(0, "Silence", PendingIntent.getBroadcast(app, 3,
                new Intent(app, AlertActionReceiver.class).setAction(AlertActionReceiver.ACTION_SILENCE),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            // Before notification channels, sound and vibration were set per notification.
            builder.setSound(ringtone(app), AudioManager.STREAM_ALARM).setVibrate(VIBRATION);
        }
        Notification notification = builder.build();
        // Repeat the sound until the notification is opened, silenced or cancelled.
        notification.flags |= Notification.FLAG_INSISTENT;
        NotificationManager manager = notificationManager(app);
        manager.cancel(WAITING_ID);
        manager.notify(RING_ID, notification);

        WorkManager.getInstance(app).enqueueUniqueWork(TIMEOUT_WORK, ExistingWorkPolicy.REPLACE,
            new OneTimeWorkRequest.Builder(AlertTimeoutWorker.class)
                .setInitialDelay(RING_MILLIS, TimeUnit.MILLISECONDS)
                .build());
    }

    /**
     * Stops the ring but leaves a quiet reminder that a request is waiting. Keyed on the pending
     * flag rather than the ringing notification, which the system may already have timed out.
     */
    static void silence(Context context) {
        Context app = context.getApplicationContext();
        SharedPreferences prefs = prefs(app);
        if (!prefs.getBoolean(KEY_PENDING, false)) return;
        prefs.edit().putBoolean(KEY_PENDING, false).apply();
        NotificationManager manager = notificationManager(app);
        manager.cancel(RING_ID);
        WorkManager.getInstance(app).cancelUniqueWork(TIMEOUT_WORK);
        // With the dashboard on screen, the request is already in front of the doctor.
        if (appInForeground) return;
        manager.notify(WAITING_ID, waiting(app, WAITING_CHANNEL,
            "Appointment request waiting", prefs.getString(KEY_BODY, "Open ABI Doctor to review it.")));
    }

    /** The doctor opened ABI Doctor: the request list is in front of them, so clear every alert. */
    public static void dismissAll(Context context) {
        Context app = context.getApplicationContext();
        prefs(app).edit().putBoolean(KEY_PENDING, false).apply();
        NotificationManager manager = notificationManager(app);
        manager.cancel(RING_ID);
        manager.cancel(WAITING_ID);
        WorkManager.getInstance(app).cancelUniqueWork(TIMEOUT_WORK);
    }

    static boolean canUseFullScreen(Context context) {
        return Build.VERSION.SDK_INT < 34 || notificationManager(context).canUseFullScreenIntent();
    }

    /** MIUI (Xiaomi, Redmi, POCO) blocks waking the screen and lock-screen cards behind its own switches. */
    static boolean isXiaomi() {
        return "xiaomi".equalsIgnoreCase(Build.MANUFACTURER) || "redmi".equalsIgnoreCase(Build.BRAND)
            || "poco".equalsIgnoreCase(Build.BRAND);
    }

    /** MIUI's private permission switches, as AppOps codes. */
    static final int MIUI_AUTOSTART = 10008;
    static final int MIUI_SHOW_ON_LOCK_SCREEN = 10020;
    static final int MIUI_BACKGROUND_POPUPS = 10021;

    /** Whether a MIUI switch is on for ABI Doctor, or null when this phone does not say. */
    static Boolean miuiAllowed(Context context, int op) {
        try {
            AppOpsManager ops = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            Method check = AppOpsManager.class.getMethod("checkOpNoThrow", int.class, int.class, String.class);
            Object mode = check.invoke(ops, op, Process.myUid(), context.getPackageName());
            return mode instanceof Integer ? (Integer) mode == AppOpsManager.MODE_ALLOWED : null;
        } catch (ReflectiveOperationException | RuntimeException unavailable) {
            return null;
        }
    }

    static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = notificationManager(context);
        if (manager.getNotificationChannel(RING_CHANNEL) == null) {
            NotificationChannel ring = new NotificationChannel(
                RING_CHANNEL, "Ringing request alerts", NotificationManager.IMPORTANCE_HIGH);
            ring.setDescription("Rings until you open a new appointment request.");
            ring.setSound(ringtone(context), new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            ring.enableVibration(true);
            ring.setVibrationPattern(VIBRATION);
            ring.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            // Takes effect only if the doctor lets ABI Doctor override Do Not Disturb.
            ring.setBypassDnd(true);
            manager.createNotificationChannel(ring);
        }
        if (manager.getNotificationChannel(WAITING_CHANNEL) == null) {
            NotificationChannel waiting = new NotificationChannel(
                WAITING_CHANNEL, "Waiting requests", NotificationManager.IMPORTANCE_LOW);
            waiting.setDescription("A quiet reminder after a ringing alert stops.");
            manager.createNotificationChannel(waiting);
        }
        if (manager.getNotificationChannel(PLAIN_CHANNEL) == null) {
            NotificationChannel plain = new NotificationChannel(
                PLAIN_CHANNEL, "Appointments", NotificationManager.IMPORTANCE_HIGH);
            plain.setDescription("New appointment requests and clinic updates");
            manager.createNotificationChannel(plain);
        }
    }

    static Notification waiting(Context context, String channel, String title, String body) {
        return new NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_stat_appointment)
            .setColor(0xFF0D9488)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(openApp(context))
            .setAutoCancel(true)
            .build();
    }

    static PendingIntent openApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static Uri ringtone(Context context) {
        return Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.appointment_ring);
    }

    private static NotificationManager notificationManager(Context context) {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
