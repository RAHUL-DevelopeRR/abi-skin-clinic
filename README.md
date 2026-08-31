# ABI Skin & Hair Clinic

Clinic website and appointment operations system built with React, Cloudflare Pages Functions, and Cloudflare D1.

## What is real

- Appointment requests are stored in D1 and use a database uniqueness rule to prevent double booking.
- Availability is generated from doctor-managed weekly hours, leave days, occupied slots, booking horizon, and notice time.
- `/admin` is password protected and lets clinic staff manage appointment statuses, working days and periods, leave days, services, and review moderation.
- A completed appointment receives a one-time review token. Only approved reviews are public.
- Patient appointment status can be checked with the booking reference and registered phone number.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
copy .dev.vars.example .dev.vars
npm run d1:migrate:local
npm run build
npm run pages:dev
```

Open the local URL printed by Wrangler. The public site is at `/` and the doctor dashboard is at `/admin`.

## Production setup

The GitHub workflow deploys the Pages project and applies D1 migrations. Configure these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_PASSWORD` (at least 12 characters; use a long unique value)

The D1 binding is named `DB`. Wrangler can provision `abi-skin-clinic-db` from `wrangler.jsonc` during the first deployment. Confirm the generated database binding and migration step in the first workflow run.

## Checks

```bash
npm run check
```

This runs linting, scheduling unit tests, and the production build.

## Data and privacy

Appointments, review invitations, approved/pending reviews, sessions, clinic schedules, leave days, and audit events are stored in Cloudflare D1. No patient images are collected. See `public/privacy.html` for the patient-facing notice.
