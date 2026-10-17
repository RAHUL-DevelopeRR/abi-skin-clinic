# Patient SMS, WhatsApp and Google reviews

Patients hear about their appointment in three ways, in this order of preference.

## 1. Automatic SMS from the clinic phone (free, uses the recharge pack)

ABI Doctor (version 1.1 or later) can send patient SMS itself, from the SIM of
one registered Android phone. No SMS gateway, DLT registration or per-message
fee is needed: the messages count against the phone's normal SMS pack.

| What happens | SMS the patient gets |
| --- | --- |
| Patient books on the website | Request received: name, reference, treatment, date, time, clinic |
| Doctor sets Requested → Confirmed | CONFIRMED with the same details and the clinic number |
| Doctor sets Requested → Cancelled (shown as **Reject**) | Sorry, the slot cannot be taken; call or rebook |
| Doctor sets Confirmed → Cancelled | Visit cancelled; call or rebook |
| Doctor sets → Completed | Thank you + short Google review link (`abiskinandhaircare.in/r/karur`) |

- Every message fits in one 160-character SMS. Long names use the first name and
  very long treatments are left out.
- Each message goes out once per appointment. Changing a status back and forth
  does not text the patient again; use **Resend automatic SMS** for that.
- Each appointment shows the SMS status: waiting for phone, sending, sent,
  delivered or failed (with the reason, such as "no mobile signal").
- A daily limit (default 100, matching most Indian packs) stops the phone from
  running past its pack. Messages over the limit are marked failed so they can be
  sent manually.

### How it works

1. The server stores the message and sends the registered phone a silent
   Firebase wake-up that contains no patient details.
2. ABI Doctor on that phone fetches the message over HTTPS using a secret it
   received at registration, sends it from the SIM and reports sent/delivered.
3. If a wake-up is missed, the phone checks every 15 minutes and whenever ABI
   Doctor is opened. A message is never sent twice: the phone remembers what it
   has sent, and the server re-offers a message only if the phone went silent.

### Set up the clinic phone

1. Install ABI Doctor 1.1+ on the Android phone whose SIM should send the SMS.
   It must stay switched on, charged and online (Wi-Fi or mobile data).
2. Sign in, open the **SMS phone** tab, enter that SIM's 10-digit number and tap
   **Register this phone**. Allow the SMS permission when Android asks.
3. Tap **Open battery settings** and set ABI Doctor to *Unrestricted* / *Don't
   optimise*, otherwise Android may delay messages when the screen is off.
4. Send a test SMS to your own number from the same tab.

Only one phone sends at a time. Registering another phone replaces the first;
**Stop automatic SMS** unregisters it.

> Google Play does not allow SMS-sending apps that are not the phone's default
> SMS app, so ABI Doctor with this feature is installed directly from the APK.

## 2. One-tap manual messages

Every appointment card also has **WhatsApp** and **SMS** buttons that open the
phone's apps with a ready-written message for the current status. Use them when
automatic sending is off or a message failed.

## 3. Automatic WhatsApp (optional, paid per message by Meta)

When the `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` secrets are set,
the server also sends approved WhatsApp templates on the same events. Rejections
use the cancellation template. The four templates are defined in
`WHATSAPP_TEMPLATES` in `functions/_lib/patient-messages.js` (Utility category,
English). Meta rejects templates that start or end with a variable; a test checks this.

Setup: create a Meta Business account and WhatsApp Business app, add a number
not used on the regular WhatsApp app, create the four templates, create a
System User token with `whatsapp_business_messaging`, then:

```sh
npx wrangler pages secret put WHATSAPP_ACCESS_TOKEN --project-name=abi-skin-clinic
npx wrangler pages secret put WHATSAPP_PHONE_NUMBER_ID --project-name=abi-skin-clinic
```

## Google reviews

No Google API lets a business post reviews for patients. Instead:

- Completed patients get the clinic's Google review link by SMS/WhatsApp.
- Website reviewers are redirected to Google afterwards, with their text copied.
- The doctor app's Reviews tab has **Review us on Google** buttons, and each
  clinic's link can be changed in **Clinics**.

### Live Google rating and reviews on the website (Places API)

The Reviews section can show each clinic's live Google rating and up to five
Google-selected reviews. Visitors tap **Show Google reviews** to load them.

- Cost: these requests are billed as Place Details *Enterprise + Atmosphere*:
  1,000 free a month, then about $25 per 1,000. Google's terms forbid storing
  reviews, so every load is a request.
- The server allows at most 32 Google requests a day (about 990 a month) and 6
  per visitor per hour, so normal use stays free. When the daily budget is used
  up, visitors are pointed to Google Maps until the next day.
  `GOOGLE_PLACES_DAILY_LIMIT` changes the daily budget.
- Each clinic's Google place ID is looked up once (an ID-only search, which is
  free) and stored, as Google allows.

Setup:

1. In Google Cloud Console create a project, link a billing account and enable
   **Places API (New)**.
2. Create an API key and restrict it to **Places API (New)**.
3. Optional safety net: in *APIs & Services → Places API (New) → Quotas*, cap
   requests per day (for example at 32).
4. Save the key as a secret:

   ```sh
   npx wrangler pages secret put GOOGLE_PLACES_API_KEY --project-name=abi-skin-clinic
   ```

5. Redeploy. Until the key exists, the Google reviews block stays hidden.
