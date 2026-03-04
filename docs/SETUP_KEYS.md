# GPX TrackPro - Keys Setup (Google, Stripe, SMTP)

This guide explains where to get each key and where to put it.

## 1) Where to add keys

Use:

`/Users/zakaria/Documents/GPX-Training-Analyzer/.env`

Variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8083/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_PREMIUM=

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Restart backend after any `.env` change (`npm run dev` or `./dev.sh`).

## 2) Google OAuth (Continue with Google)

1. Open Google Cloud Console: `https://console.cloud.google.com/`
2. Create/select a project
3. Go to `APIs & Services > Credentials`
4. Click `Create Credentials > OAuth client ID`
5. Select `Web application`
6. Add redirect URI:
   - Docker backend: `http://localhost:8083/auth/google/callback`
   - Local backend: `http://localhost:8080/auth/google/callback`
7. Copy:
   - `Client ID` -> `GOOGLE_CLIENT_ID`
   - `Client Secret` -> `GOOGLE_CLIENT_SECRET`
8. Set `GOOGLE_REDIRECT_URI` to the same URI configured above.

## 3) Stripe (subscriptions)

1. Open Stripe Dashboard: `https://dashboard.stripe.com/`
2. Test mode:
   - `Developers > API keys > Secret key` -> `STRIPE_SECRET_KEY`
3. Create 2 recurring prices:
   - Pro monthly -> `STRIPE_PRICE_ID_PRO`
   - Premium monthly -> `STRIPE_PRICE_ID_PREMIUM`
4. Run local webhook with Stripe CLI:
   - Local backend `8080`:
     `stripe listen --forward-to localhost:8080/stripe/webhook`
   - Docker backend `8083`:
     `stripe listen --forward-to localhost:8083/stripe/webhook`
5. Copy the printed webhook secret `whsec_...` -> `STRIPE_WEBHOOK_SECRET`

## 4) SMTP (password reset + verification emails)

Use any provider (Mailgun, SendGrid, Postmark, Brevo, etc.) and fill:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

If SMTP is empty in development:

- the app still works
- password reset link is shown directly in the UI

## 5) Quick verification

1. Start app: `npm run dev`
2. Open `Settings`
3. Check:
   - `Google` tab: Google configured/not configured
   - `Plan` tab: Stripe configured/not configured
   - `Security` tab: SMTP configured/not configured
