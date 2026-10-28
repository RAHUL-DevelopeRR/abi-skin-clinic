package in.abiskinandhaircare.doctor.alerts;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

/** Stops a ring nobody answered after a minute, leaving the quiet "waiting" notification. */
public class AlertTimeoutWorker extends Worker {

    public AlertTimeoutWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        AppointmentAlerts.silence(getApplicationContext());
        return Result.success();
    }
}
