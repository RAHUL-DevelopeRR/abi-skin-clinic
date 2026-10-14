# Patient WhatsApp & SMS notifications

Patients are told about their appointment in two ways.

## 1. One-tap manual messages (works today, free)

Every appointment card in the doctor app has **WhatsApp** and **SMS** buttons.
They open WhatsApp or the phone's SMS app with the patient's number and a
ready-written message for the current status:

| Status | Message the patient receives |
| --- | --- |
| Requested | Request received, reference number, tracking link |
| Confirmed | Confirmation with date, time, address and clinic phone |
| Cancelled | Cancellation notice with clinic phone and booking link |
| Completed | Thank-you message with the clinic's Google review link |
| No-show | "We missed you" with clinic phone and booking link |

The doctor only has to press Send. Messages go from the clinic's own WhatsApp or SIM.

## 2. Automatic WhatsApp (WhatsApp Cloud API)

When configured, the server sends a WhatsApp message automatically:

- immediately after a patient books (acknowledgement), and
- whenever the doctor changes the status to Confirmed, Cancelled or Completed.

Each attempt is logged in `patient_notifications`. The doctor app shows
"✓ WhatsApp sent" or "✗ WhatsApp failed" on the appointment, and a
**Resend automatic WhatsApp** action. If sending fails, use the manual buttons.

### One-time setup

1. Create a Meta Business account and a WhatsApp Business app at
   <https://developers.facebook.com/apps>. Add a phone number that is **not**
   already used on the regular WhatsApp app, and complete business verification.
2. In WhatsApp Manager → Message templates, create these four templates,
   category **Utility**, language **English** (`en`). Keep the names and the
   order of the `{{n}}` placeholders exactly as shown.

   **`appointment_received`**
   > Hello {{1}}, we have received your appointment request at {{2}} for {{3}} on {{4}} at {{5}}. Reference: {{6}}. The clinic will confirm it shortly.

   **`appointment_confirmed`**
   > Hello {{1}}, your appointment at {{2}} on {{3}} at {{4}} is confirmed. Reference: {{5}}. To reschedule, call {{6}}.

   **`appointment_cancelled`**
   > Hello {{1}}, your appointment {{2}} on {{3}} at {{4}} has been cancelled. Please call {{5}} to book a new time.

   **`appointment_review`**
   > Thank you for visiting {{2}}, {{1}}. Please share your experience on Google: {{3}}

3. Create a System User with a **permanent** access token that has the
   `whatsapp_business_messaging` permission.
4. Add the Cloudflare Pages secrets (production environment):

   ```sh
   npx wrangler pages secret put WHATSAPP_ACCESS_TOKEN --project-name=abi-skin-clinic
   npx wrangler pages secret put WHATSAPP_PHONE_NUMBER_ID --project-name=abi-skin-clinic
   ```

   Optional: `WHATSAPP_TEMPLATE_LANGUAGE` (default `en`) and
   `WHATSAPP_GRAPH_VERSION` (default `v23.0`).
5. Redeploy. Until both secrets exist, automatic sending is skipped and the
   app shows "Auto-WhatsApp off · send manually".

Meta charges per delivered utility message (check current Indian pricing in
WhatsApp Manager). Patients consent to WhatsApp contact on the booking form.

### Why not automatic SMS?

Bulk SMS in India requires DLT registration (entity, sender ID and every
template approved with TRAI) before any gateway such as MSG91 or Twilio will
deliver. WhatsApp needs only Meta's approval and is what patients read. If SMS
is still wanted, register on a DLT portal first; a sender can then be added
next to `sendPatientWhatsApp` in `functions/_lib/patient-messages.js`.

## Google reviews

Google does not let a business post reviews for its patients. Copying
patient reviews onto Google would break Google's fake-review policy and can get
the listing penalised. What the system does instead:

- After a patient submits a verified review on the website, they see
  **Review us on Google**. Their review text is copied so they can paste it.
  This is shown for every rating, because asking only happy patients is also
  against Google policy.
- The completed-appointment WhatsApp/SMS message links straight to the clinic's Google reviews, and the doctor app's Reviews tab has "Review us on Google" buttons.
- Patients who leave a review on the website are redirected to Google afterwards, with their text copied.
- Each clinic's Google link is set in the doctor app → **Clinics**. By default
  it opens the clinic's Google Maps listing. For a link that opens the review
  box directly, open Google Business Profile → **Ask for reviews** and paste
  that `g.page/r/…/review` link.
