package in.abiskinandhaircare.doctor.sms;

import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import in.abiskinandhaircare.doctor.alerts.AppointmentAlerts;
import java.util.Map;

/**
 * Android delivers Firebase messages to a single service. This one handles the silent
 * "SMS jobs waiting" wake-up and the ringing new-request alert, and passes every other
 * message to Capacitor.
 */
public class ClinicMessagingService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");
        if ("sms_jobs".equals(type)) {
            // Already on a background thread with a short execution window for high-priority messages.
            SmsJobRunner.run(getApplicationContext());
            return;
        }
        if ("appointment_request".equals(type)) {
            AppointmentAlerts.onNewRequest(getApplicationContext(), data.get("title"), data.get("body"));
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        SmsGatewayStore store = new SmsGatewayStore(this);
        if (!store.isConfigured()) return;
        new Thread(() -> {
            try {
                new SmsGatewayApi(store.getApiBase(), store.getSecret()).updatePushToken(token);
            } catch (Exception ignored) {
                // The 15-minute poll keeps SMS flowing until the next token update succeeds.
            }
        }, "abi-sms-token").start();
    }
}
