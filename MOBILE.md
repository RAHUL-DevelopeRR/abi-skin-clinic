# ABI Doctor Android app

The Android app is a Capacitor shell for the production doctor dashboard at
`https://abiskinandhaircare.in/admin`. It uses the same Cloudflare Pages API,
D1 database and secure server-side session as the web dashboard.

## Included

- Appointments, patient timings and status management
- Working days, slot duration and leave management
- Treatment availability and verified-review moderation
- Clinic calling, Google Maps navigation and review listing access
- 30-second foreground monitoring, refresh on app resume and network status
- Firebase background notifications with no patient information in the alert
- Automatic patient SMS sent from the registered clinic phone's SIM (SMS phone tab)
- One-tap WhatsApp/SMS messages to patients and optional automatic WhatsApp
  (see [NOTIFICATIONS.md](NOTIFICATIONS.md))
- Editable Google review link per clinic
- Offline screen with automatic retry instead of a browser error page
- Screenshot blocking, disabled Android backups and HTTPS-only traffic

The app loads `https://abiskinandhaircare.in/admin`, so dashboard changes go
live with a website deploy. Rebuild the APK only for native changes
(`capacitor.config.json`, `android/`, plugins).

## Build

Use Node 22, Java 21 and Android SDK 36.

```sh
npm ci
npm run android:sync
cd android
./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
GitHub Actions also builds and retains this APK after Android-related pushes.

## Enable production push notifications

1. Create a Firebase Android app with package ID `in.abiskinandhaircare.doctor`.
2. Put its `google-services.json` in `android/app/` (the file is gitignored).
3. Create a Firebase service account with permission to send Cloud Messaging.
4. Upload the complete service-account JSON as the Cloudflare Pages secret
   `FIREBASE_SERVICE_ACCOUNT_JSON`.
5. Set the Cloudflare Pages secret `MOBILE_PUSH_ENABLED` to `true`.
6. Apply D1 migration `0003_doctor_devices.sql` and redeploy the Pages app.

Without the Firebase secret, appointment creation remains functional and push
delivery is safely skipped.

## Signed release APK (version 1.1.1+)

Android only installs an update over the existing app when both are signed with
the same key. Builds up to 1.1.0 were debug builds with a different key each
time, so moving to 1.1.1 needs one last uninstall; later updates install over it.

Run the **Android Doctor App** GitHub workflow manually with **release** ticked.
It builds the signed APK (`abi-doctor-release-apk`, the file to install) and the
Play Store AAB (`abi-doctor-release-aab`) from these repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`

The keystore and its passwords are kept outside the repository and must be
backed up. If the key is lost, no update can be installed over the app again.
Bump `versionCode` in `android/app/build.gradle` for every release.

## SMS phone (version 1.1+)

ABI Doctor includes a native SMS sender (`android/app/src/main/java/in/abiskinandhaircare/doctor/sms`).
The registered clinic phone receives a silent Firebase wake-up, fetches queued
messages over HTTPS and sends them with Android's `SmsManager`, falling back to a
15-minute WorkManager check. It requires the `SEND_SMS` permission, which Google
Play only grants to default SMS apps, so this build is distributed as an APK.
See [NOTIFICATIONS.md](NOTIFICATIONS.md) for setup.
