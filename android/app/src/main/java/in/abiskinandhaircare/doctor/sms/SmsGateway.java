package in.abiskinandhaircare.doctor.sms;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.TimeUnit;

/** Background scheduling for the SMS gateway. */
public final class SmsGateway {

    private static final String POLL_WORK = "abi-sms-poll";

    private SmsGateway() {}

    /** Fallback when a Firebase wake-up is missed: check for queued SMS every 15 minutes (Android's minimum). */
    static void schedulePolling(Context context) {
        PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(PollWorker.class, 15, TimeUnit.MINUTES)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(POLL_WORK, ExistingPeriodicWorkPolicy.KEEP, request);
    }

    static void cancelPolling(Context context) {
        WorkManager.getInstance(context).cancelUniqueWork(POLL_WORK);
    }

    /** Runs the job runner off the main thread. */
    static void processInBackground(Context context) {
        Context app = context.getApplicationContext();
        new Thread(() -> SmsJobRunner.run(app), "abi-sms-run").start();
    }

    public static class PollWorker extends Worker {

        public PollWorker(@NonNull Context context, @NonNull WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            SmsJobRunner.run(getApplicationContext());
            return Result.success();
        }
    }
}
