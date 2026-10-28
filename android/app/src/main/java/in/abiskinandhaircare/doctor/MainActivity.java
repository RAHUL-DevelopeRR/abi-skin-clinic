package in.abiskinandhaircare.doctor;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import in.abiskinandhaircare.doctor.alerts.AppointmentAlerts;
import in.abiskinandhaircare.doctor.alerts.AppointmentAlertsPlugin;
import in.abiskinandhaircare.doctor.sms.SmsGatewayPlugin;
import in.abiskinandhaircare.doctor.video.VideoUploaderPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmsGatewayPlugin.class);
        registerPlugin(AppointmentAlertsPlugin.class);
        registerPlugin(VideoUploaderPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
    }

    @Override
    public void onResume() {
        super.onResume();
        // The dashboard is on screen now, showing the request that rang.
        AppointmentAlerts.dismissAll(this);
    }
}
