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
- Screenshot blocking, disabled Android backups and HTTPS-only traffic

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
5. Apply D1 migration `0003_doctor_devices.sql` and redeploy the Pages app.

Without the Firebase secret, appointment creation remains functional and push
delivery is safely skipped.

## Signed Play Store bundle

The manual **Android Doctor App** GitHub workflow builds the signed AAB after
these repository secrets are configured:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `FIREBASE_GOOGLE_SERVICES_JSON_BASE64`

The release AAB is written to
`android/app/build/outputs/bundle/release/app-release.aab`.
