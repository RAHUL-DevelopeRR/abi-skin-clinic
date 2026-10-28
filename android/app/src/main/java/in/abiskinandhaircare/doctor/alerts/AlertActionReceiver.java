package in.abiskinandhaircare.doctor.alerts;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** The "Silence" button on the ringing notification. */
public class AlertActionReceiver extends BroadcastReceiver {

    static final String ACTION_SILENCE = "in.abiskinandhaircare.doctor.alerts.SILENCE";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_SILENCE.equals(intent.getAction())) AppointmentAlerts.silence(context);
    }
}
