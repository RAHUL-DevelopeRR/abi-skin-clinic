package in.abiskinandhaircare.doctor.alerts;

import android.app.KeyguardManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import in.abiskinandhaircare.doctor.MainActivity;
import in.abiskinandhaircare.doctor.R;

/** Full-screen "New appointment request" card, shown over the lock screen while the alert rings. */
public class AppointmentAlertActivity extends AppCompatActivity {

    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_appointment_alert);
        findViewById(R.id.alert_open).setOnClickListener((view) -> openRequests());
        findViewById(R.id.alert_silence).setOnClickListener((view) -> {
            AppointmentAlerts.silence(this);
            finish();
        });
        showRequest(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        showRequest(intent);
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    private void showRequest(Intent intent) {
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        ((TextView) findViewById(R.id.alert_title)).setText(title == null ? "New appointment request" : title);
        ((TextView) findViewById(R.id.alert_body)).setText(body == null ? "" : body);
        // The ring stops after a minute; the card should not stay lit on the lock screen either.
        handler.removeCallbacksAndMessages(null);
        handler.postDelayed(this::finish, AppointmentAlerts.RING_MILLIS);
    }

    private void openRequests() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        KeyguardManager keyguard = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && keyguard != null && keyguard.isKeyguardLocked()) {
            // Stop the ring but keep the reminder until the dashboard is really open: the doctor
            // may back out of the PIN prompt. MainActivity clears the reminder when it appears.
            AppointmentAlerts.silence(this);
            keyguard.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override
                public void onDismissSucceeded() {
                    startActivity(open);
                    finish();
                }
            });
        } else {
            AppointmentAlerts.dismissAll(this);
            startActivity(open);
            finish();
        }
    }
}
