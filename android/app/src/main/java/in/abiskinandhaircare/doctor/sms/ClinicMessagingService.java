package in.abiskinandhaircare.doctor.sms;

import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Android delivers Firebase messages to a single service. This one handles the silent
 * "SMS jobs waiting" wake-up and passes every other message (doctor alerts) to Capacitor.
 */
public class ClinicMessagingService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        if ("sms_jobs".equals(remoteMessage.getData().get("type"))) {
            // Already on a background thread with a short execution window for high-priority messages.
            SmsJobRunner.run(getApplicationContext());
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
