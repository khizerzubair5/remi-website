# Remi Website — Handoff Document
**Last updated:** May 28, 2026
**Status:** Waitlist serverless function built. Needs Vercel env vars set before deploy.

---

## What This Repo Is

Static marketing site for **Remi** — Canvas deadline SMS reminder service for GMU students. Deployed on Vercel at **get-remi.com**. This is the Fall 2026 waitlist page, not the onboarding flow (that lives in `remi-backend/public/`).

**Companion repo:** `C:\Users\omer1\Documents\remi-backend` — Express API on Railway, the actual product.

---

## Architecture

| Layer | What it is |
|---|---|
| Static site | `index.html` + `css/style.css` + `js/app.js` — no build step |
| Serverless API | `api/waitlist.js` — Vercel Node.js function |
| Database | Neon (PostgreSQL) — table `remi-waitlist-table` |
| SMS | Twilio — confirmation text sent on successful signup |

### Waitlist form flow
1. User fills out name, email, phone on `index.html`
2. `js/app.js` normalises phone to E.164 (`+1XXXXXXXXXX`) client-side
3. POSTs `{ name, email, phone }` to `/api/waitlist` (same-origin Vercel function)
4. `api/waitlist.js`:
   - Validates fields
   - Checks for duplicate phone in Neon — returns 409 if already registered
   - Inserts row into `remi-waitlist-table`
   - Sends Twilio confirmation SMS (non-fatal: signup is recorded even if SMS fails)
5. Client shows success state

---

## Neon Schema

Table: `public."remi-waitlist-table"`

```sql
id         SERIAL PRIMARY KEY
name       TEXT NOT NULL
email      TEXT NOT NULL
phone      TEXT NOT NULL              -- E.164 format (+1XXXXXXXXXX)
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

No UNIQUE constraint on phone in DB — duplicate check is done in `api/waitlist.js` at the app level.

---

## Confirmation SMS (Twilio)

Sent from `TWILIO_PHONE_NUMBER` to the user's phone on successful signup:

```
Hey {name} 👋 You're on the Remi waitlist for Fall 2026.

Enrollment opens in August — I'll text you when it's time to get set up at GMU.

— Remi 🌿
Reply STOP to unsubscribe
```

SMS failure is non-fatal — signup is recorded in Neon regardless.

---

## Environment Variables

Set these in the **Vercel dashboard** under Project → Settings → Environment Variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (from Neon dashboard → Connection string) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sending number in E.164 (e.g. `+17031234567`) |

> Use the same Twilio credentials as `remi-backend`. They're already in the Railway env vars.

---

## Local Development

```bash
node serve.js          # static preview at http://localhost:4200
```

`serve.js` does not run the serverless function. To test the waitlist API locally:
```bash
npm install -g vercel
vercel dev             # runs both static site + /api/waitlist at http://localhost:3000
```

Requires a `.env.local` file (not committed):
```
DATABASE_URL=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## Deploy

Push to `main` → Vercel auto-deploys. No build step. Vercel installs `package.json` dependencies for the serverless function automatically.

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Entire site — nav, hero, how-it-works, phone carousel, founder, waitlist form, footer |
| `css/style.css` | All styles |
| `js/app.js` | Scroll animations, phone carousel, waitlist form submission |
| `api/waitlist.js` | Vercel serverless function — Neon insert + Twilio SMS |
| `package.json` | Dependencies: `@neondatabase/serverless`, `twilio` |
| `vercel.json` | `cleanUrls: true` |
| `privacy.html` / `terms.html` | Legal pages linked from footer |

---

## What's Done

- [x] Waitlist form (index.html) — name, email, phone fields with client-side validation
- [x] Phone normalisation to E.164 (js/app.js)
- [x] Vercel serverless function (`api/waitlist.js`) — Neon insert + Twilio SMS
- [x] Duplicate phone check at API level
- [x] Confirmation SMS in Remi's voice
- [x] API_BASE updated to same-origin (no Railway dependency)
- [x] Live waitlist count shown on page load below the form sub-heading (social proof)
- [x] Names list shown in success state after signup — "You're joining X others"
- [x] `api/waitlist-public.js` — GET endpoint, returns first names + count only (no PII)

## What Still Needs To Be Done

- [x] **Set Vercel env vars** (`DATABASE_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
- [ ] **Test end-to-end** — submit form, verify Neon row, verify SMS received
- [ ] **Testimonials section** — uncomment in `index.html` once real student quotes from WTP interviews are collected
- [ ] **Add UNIQUE constraint on phone** in Neon table (currently enforced at app level only)
- [ ] Consider adding email UNIQUE constraint as well

---

## Fall 2026 Onboarding Plan

### Decided: Two-step paid onboarding

Payment is the commitment gate. Once a user pays, completion of both steps is near-certain.

```
August SMS/email blast to waitlist
  → Stripe payment (mobile-friendly hosted checkout)
  → Moment 1: name, school, timezone — 30 sec on mobile (new form)
  → Remi texts: "One more step on your laptop → [link]"
  → Moment 2: iCal URL + syllabus uploads on desktop (existing remi-backend/public/ form)
  → Welcome SMS fires automatically, reminders begin
```

### What needs to be built

| Piece | Where | Status |
|---|---|---|
| Waitlist capture | remi-website | ✅ Done |
| August SMS/email blast to waitlist | One-off script | Not built |
| Stripe payment | Hosted Stripe checkout | Not built |
| Moment 1 form — basic info, mobile-optimized | remi-website or remi-backend/public/ | Not built |
| Moment 2 form — iCal + syllabi, desktop | remi-backend/public/ | ✅ Already exists |
| Post-payment SMS nudge with desktop link | remi-backend | Not built |

### Key decisions still open
- Pricing for Fall semester (was $9 for summer pilot)
- Stripe vs. continued Venmo (Stripe preferred for scale)
- Whether Moment 1 form lives in remi-website or remi-backend/public/

---

## Notes

- Twilio A2P registration may be needed for toll-free/long-code sending at scale. Same status as remi-backend.
- The `remi-backend` Railway server is NOT used by this site at all — the waitlist is fully self-contained on Vercel + Neon.
- The testimonials section exists in `index.html` but is commented out — uncomment once real quotes from the May 2026 WTP interviews are collected.
