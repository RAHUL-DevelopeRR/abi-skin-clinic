package in.abiskinandhaircare.doctor.sms;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;

/** Receives the radio's "sent" and "delivered" results and reports them to the clinic server. */
public class SmsResultReceiver extends BroadcastReceiver {

    static final String ACTION_SENT = "in.abiskinandhaircare.doctor.SMS_SENT";
    static final String ACTION_DELIVERED = "in.abiskinandhaircare.doctor.SMS_DELIVERED";
    static final String EXTRA_JOB_ID = "jobId";
    static final String EXTRA_LAST_PART = "lastPart";

    // Delivery report status values from 3GPP TS 23.040: 0 = delivered, 0x40+ = permanent error.
    private static final int STATUS_COMPLETE = 0x00;
    private static final int STATUS_PERMANENT_ERROR = 0x40;

    @Override
    public void onReceive(Context context, Intent intent) {
        String jobId = intent.getStringExtra(EXTRA_JOB_ID);
        if (jobId == null) return;
        final String status;
        final String error;
        if (ACTION_SENT.equals(intent.getAction())) {
            int code = getResultCode();
            if (code != Activity.RESULT_OK) {
                status = "failed";
                error = sendError(code);
            } else if (intent.getBooleanExtra(EXTRA_LAST_PART, true)) {
                status = "sent";
                error = null;
            } else {
                return;
            }
        } else if (ACTION_DELIVERED.equals(intent.getAction())) {
            int reportStatus = deliveryStatus(intent);
            if (reportStatus == STATUS_COMPLETE) {
                status = "delivered";
                error = null;
            } else if (reportStatus >= STATUS_PERMANENT_ERROR) {
                status = "failed";
                error = "The network could not deliver the SMS to the patient.";
            } else {
                return;
            }
        } else {
            return;
        }
        PendingResult pending = goAsync();
        Context app = context.getApplicationContext();
        new Thread(() -> {
            try {
                SmsJobRunner.report(app, jobId, status, error);
            } finally {
                pending.finish();
            }
        }, "abi-sms-report").start();
    }

    private static int deliveryStatus(Intent intent) {
        byte[] pdu = intent.getByteArrayExtra("pdu");
        if (pdu == null) return STATUS_COMPLETE;
        SmsMessage message = SmsMessage.createFromPdu(pdu, intent.getStringExtra("format"));
        return message == null ? STATUS_COMPLETE : message.getStatus();
    }

    private static String sendError(int code) {
        switch (code) {
            case SmsManager.RESULT_ERROR_NO_SERVICE:
                return "Clinic phone has no mobile signal.";
            case SmsManager.RESULT_ERROR_RADIO_OFF:
                return "Clinic phone is in airplane mode or the SIM is off.";
            case SmsManager.RESULT_ERROR_NULL_PDU:
                return "The SMS could not be encoded.";
            case SmsManager.RESULT_ERROR_LIMIT_EXCEEDED:
                return "Android's SMS sending limit was reached on the clinic phone.";
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
            default:
                return "The mobile network rejected the SMS (code " + code + "). Check balance or SMS pack.";
        }
    }
}
