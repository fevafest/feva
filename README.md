# FEVA FEST

A full-stack Kenyan event ticketing marketplace: Angular frontend, Node.js/Express backend, MongoDB database, JWT authentication, and M-Pesa payments via PayHero.

## Project Structure

```
/feva-fest
  /frontend   Angular application (public site, user dashboard, organizer portal, admin portal)
  /backend    Node.js + Express API, MongoDB models, PayHero integration
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB 6+ (local install, Docker, or a MongoDB Atlas cluster)
- A PayHero merchant account (for real M-Pesa payments)

## 1. MongoDB Setup

Choose one of the following:

**Local install**
Install MongoDB Community Server and start it so it listens on `mongodb://127.0.0.1:27017`.

**Docker**
```bash
docker run -d --name feva-mongo -p 27017:27017 mongo:7
```

**MongoDB Atlas**
Create a free cluster at mongodb.com/atlas and copy its connection string (it looks like `mongodb+srv://user:pass@cluster.mongodb.net/feva-fest`).

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:4200

MONGO_URI=mongodb://127.0.0.1:27017/feva-fest

JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

PAYHERO_API_BASE_URL=https://backend.payhero.co.ke/api/v2
PAYHERO_USERNAME=
PAYHERO_PASSWORD=
PAYHERO_CHANNEL_ID=
PAYHERO_CALLBACK_URL=https://your-public-domain.com/api/payments/payhero/callback

PLATFORM_FEE_PERCENT=0.05
PLATFORM_FEE_FIXED=0

EMAIL_HOST=
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=FEVA FEST <no-reply@fevafest.co.ke>
```

Seed the database with a working superadmin, a regular admin, an approved organizer and sample events:

```bash
npm run seed
```

This prints login credentials, for example:

```
Superadmin login: admin@fevafest.co.ke / Admin@12345 (sees Payments, can create admins)
Admin login:      staffadmin@fevafest.co.ke / StaffAdmin@123 (no Payments access)
Organizer login:  organizer@fevafest.co.ke / Organizer@123
Customer login:   customer@fevafest.co.ke / Customer@123
```

Every account can log in with **either its email address or its phone number** as the identifier — the password is the same either way.

Start the API:

```bash
npm run dev     # nodemon, auto-restarts on change
# or
npm start       # plain node
```

The API listens on `http://localhost:5000` and exposes a health check at `GET /api/health`.

## 3. Frontend Setup

```bash
cd frontend
npm install
npm start        # ng serve, runs on http://localhost:4200
```

The frontend talks to the API at the URL configured in `frontend/src/environments/environment.ts` (`http://localhost:5000/api` by default). For a production build, `environment.prod.ts` uses a relative `/api` path — put the built frontend behind the same domain/reverse proxy as the API, or edit that file to point at your API's public URL.

Build for production:

```bash
npm run build
```

Output is written to `frontend/dist/frontend`.

## 4. PayHero Setup (M-Pesa Payments)

FEVA FEST integrates with [PayHero](https://payhero.africa) for M-Pesa STK Push payments, implemented against PayHero's official "Initiate MPESA STK Push" and callback docs. All PayHero logic lives in `backend/src/services/payheroService.js` and is never exposed to the frontend.

1. Create a PayHero account and a payment channel (till/paybill) from the PayHero dashboard → **Payment Channels → My Payment Channels** (this gives you the numeric `channel_id`).
2. Copy your API username and password (Basic Auth credentials).
3. Set them in `backend/.env`:
   - `PAYHERO_USERNAME`
   - `PAYHERO_PASSWORD`
   - `PAYHERO_CHANNEL_ID`
4. Set `PAYHERO_CALLBACK_URL` to a **publicly reachable** HTTPS URL pointing at `POST /api/payments/payhero/callback` on your deployed backend. PayHero cannot reach `localhost`, so for local testing use a tunnel (e.g. ngrok) and point the callback URL at the tunnel.

**Exact request PayHero receives** (`POST https://backend.payhero.co.ke/api/v2/payments`, Basic Auth):
```json
{
  "amount": 2100,
  "phone_number": "0712345678",
  "channel_id": 133,
  "provider": "m-pesa",
  "external_reference": "FEVA-XXXXXXXX",
  "customer_name": "Jane Wanjiku",
  "callback_url": "https://your-domain.com/api/payments/payhero/callback"
}
```
PayHero replies `201` immediately with `{ success, status: "QUEUED", reference, CheckoutRequestID }` — this only means the STK push was *queued*, not that payment succeeded, which is exactly why the order stays `PAYMENT_PENDING` at this point rather than `PAID`.

**Exact callback PayHero sends back** once the customer enters (or cancels) their PIN:
```json
{
  "forward_url": "",
  "response": {
    "Amount": 2100,
    "CheckoutRequestID": "ws_CO_...",
    "ExternalReference": "FEVA-XXXXXXXX",
    "MerchantRequestID": "...",
    "MpesaReceiptNumber": "SAE3YULR0Y",
    "Phone": "+254712345678",
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "Status": "Success"
  },
  "status": true
}
```
`payheroCallback` matches the order by `ExternalReference`, treats `ResultCode: 0` as success, and additionally logs (non-blocking) if `Amount` doesn't match the order total, to catch partial/mismatched payments quickly during reconciliation.

**STK abuse protection (per PayHero's docs):** more than 10 failed/cancelled requests to the *same phone number* blocks that number for 24 hours; 50+ failed requests account-wide in 6 hours restricts the whole account for 4 hours (500 → 24h, 1000 → 72h). In practice this means: don't let users spam "Pay with M-Pesa" retries — the checkout UI already disables the button while a request is in flight, but avoid adding a manual retry loop without a cooldown.

If PayHero changes any of this later, `backend/src/services/payheroService.js` (the outgoing request) and the field-mapping in `backend/src/controllers/paymentController.js` (`payheroCallback`) are the only two places that need updating — they're intentionally isolated from the rest of the app.

**Payment flow implemented:**

1. Customer selects tickets and enters their phone number → `POST /api/orders` creates an order with `paymentStatus: PENDING`.
2. Customer clicks "Pay with M-Pesa" → `POST /api/payments/initiate` marks the order `PAYMENT_PENDING` and asks PayHero to send an STK push.
3. The frontend polls `GET /api/payments/status/:reference` while the customer enters their M-Pesa PIN.
4. PayHero calls `POST /api/payments/payhero/callback` with the final result. **Only this callback can mark an order `PAID`.** The frontend receiving a "success" response from step 2 never marks anything as paid by itself.
5. On a confirmed payment, tickets and QR codes are generated exactly once (duplicate callbacks are detected and ignored).
6. On a failed/cancelled payment, the order is marked `FAILED` and no tickets are generated.

Without PayHero credentials configured, `POST /api/payments/initiate` fails safely with a clear `503` error instead of pretending payment succeeded — the rest of the app (events, orders, admin, tickets, blog) works fully without PayHero configured, which is useful for development.

## 5. Default Roles & Access

| Role | Access |
|---|---|
| `customer` | Browse events, buy tickets, view dashboard/tickets/orders |
| `organizer` | Everything a customer can do, plus create/manage their own events, view sales, scan tickets |
| `admin` | Approve organizers, create/edit/publish/unpublish events (including images and prices), manage users, orders, tickets, reports |
| `admin` + superadmin flag | Everything a regular admin can do, **plus** the only role that can view **Payments** and create/manage other admin accounts |
| `staff` | Ticket scanning only (assign this role to door staff who shouldn't get organizer/admin access) |

Organizers register via **Sell Your Event** in the header. New organizer profiles are created with `isApproved: false`; an admin approves them from **Admin → Organizers**. Events created by organizers start as `pending_approval` and only become publicly visible once an admin publishes them from **Admin → Events** — admins can edit any field there, including uploading a new poster image and changing ticket prices, at any time.

**Superadmins vs regular admins:** every admin account has a `role: 'admin'` plus an `isSuperAdmin` boolean. Only superadmins see the **Payments** and **Admins** sections in the sidebar (regular admins don't even see the links — the routes are also guarded server-side, so hitting the URL directly returns `403`, not just a hidden link). Superadmins manage this from **Admin → Admins**: create new admin accounts and grant/revoke superadmin status. The first superadmin must be created via the seed script or directly in MongoDB; after that, superadmins can create as many admins as needed from the UI.

## 6. Admin Dashboard Is Not Visible To Visitors

There is no link to `/admin` anywhere in the public site (header, footer, or any public page). Access is enforced in two independent layers:
- **Frontend route guards** redirect anyone who isn't logged in as an admin before any admin component ever renders (no flash of admin content).
- **Backend middleware** (`authorize('admin')` / `requireSuperAdmin`) rejects every admin API call from non-admins with `403`, regardless of what the frontend does — so the dashboard is inaccessible even if someone bypassed the Angular app entirely and called the API directly.
- `frontend/public/robots.txt` also tells search engines not to index `/admin`, `/dashboard` or the organizer management pages.

## 7. Player Login (Email or Phone)

Registration still asks for both an email and a Kenyan phone number (`07XXXXXXXX` / `01XXXXXXXX`), but from then on a player can **log in with either one** — the backend normalizes phone numbers to `2547XXXXXXXX` format internally so `0712345678`, `254712345678` and `+254712345678` are all treated as the same number. This is password-based (not OTP/SMS) — see "What's needed to go further" below if you want SMS one-time-codes instead.

## 8. Ticket QR Codes (Email Delivery + Single Scan)

Once a payment is confirmed by PayHero's callback, the customer's ticket(s) — each with an embedded QR code — are emailed to them automatically (see step 4 setup above). This is best-effort: if `EMAIL_HOST` isn't configured, or the send fails, the order and tickets are still created normally and the email is simply skipped (logged as a warning) — it never blocks a purchase.

Every ticket can only be scanned into use **once**: `PATCH /api/tickets/:ticketId/use` is an atomic, status-guarded update, so even two near-simultaneous scans of the same QR code can't both succeed — the loser always sees "already used". Scanning a ticket to check its validity (`POST /api/tickets/verify`) does **not** consume it by itself; door staff must explicitly tap "Mark as Used" after verifying the holder, which is deliberate — it avoids a ticket being silently burned by an accidental re-scan.

## 9. Ticket Scanning

**Admin → Scanner** and **Organizer → Ticket Scanner** open a camera-based QR scanner (using the `qr-scanner` library) that calls `POST /api/tickets/verify` and `PATCH /api/tickets/:ticketId/use`. It requires camera permission in the browser and a secure context (`https://` or `localhost`).

## 10. Production Deployment (Vercel + Render)

Code is on GitHub at `https://github.com/fevafest/feva.git`. Deployment order matters because the frontend needs to know the backend's URL at build time — deploy the backend first.

**Step 1 — MongoDB.** Use the Atlas connection string you're providing; keep it handy for step 2 and for running the seed script against it (see below).

**Step 2 — Backend on Render.**
1. Render dashboard → **New → Blueprint**, pick the `fevafest/feva` repo. Render reads `render.yaml` from the repo root and proposes a `feva-fest-api` web service rooted at `/backend` automatically.
2. Render will prompt for the env vars marked `sync: false` in `render.yaml`: `MONGO_URI` (your Atlas string), `PAYHERO_USERNAME`/`PAYHERO_PASSWORD`/`PAYHERO_CHANNEL_ID`, `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`, and `CLIENT_URL`/`PAYHERO_CALLBACK_URL` (leave placeholders for now — see step 4).
3. `JWT_SECRET` is auto-generated by Render (`generateValue: true`) — you don't need to supply one.
4. Deploy. Render gives you a URL like `https://feva-fest-api.onrender.com`. Confirm it's alive: `https://feva-fest-api.onrender.com/api/health`.

**Free vs. paid Render plan, generally:** besides the disk/uploads difference below, the free tier spins the service down after ~15 minutes of no traffic and takes 30-50 seconds to wake back up on the next request — noticeable as a slow/failed first load, and it can make a customer's M-Pesa payment feel stuck if the callback lands while the service is asleep. A paid plan (Starter, ~$7/mo) keeps it running all the time, which matters once you have real customers; free is fine for the initial setup/testing you're doing now.
5. **Note on file uploads:** Render's **free** tier has an ephemeral filesystem — anything saved to `backend/uploads` (event posters, blog covers, avatars) is wiped on every redeploy/restart.

**If you're on a paid Render plan** (Starter or above), this is fixed with a **Persistent Disk** — a real attached volume that survives deploys:
1. In `render.yaml`, uncomment the `disk:` block under the service and the `UPLOADS_DIR` env var, then commit and push (or add both directly in the Render dashboard: **service → Disks → Add Disk**, mount path `/var/data/uploads`, then **Environment → Add** `UPLOADS_DIR=/var/data/uploads`).
2. Redeploy. The app already reads `UPLOADS_DIR` (see `backend/src/config/paths.js`) — no code changes needed, uploaded files just start landing on the disk instead of the ephemeral container filesystem.
3. One caveat even with a disk: if you ever scale the backend to more than one instance, a disk is only attached to a single instance, so uploads wouldn't be visible from the others. Fine at one instance (which is what you'd run initially); for multi-instance scaling later, move uploads to Cloudinary/S3 instead — say the word and I'll wire that in.

**If you're staying on the free tier for now**, the simplest fix is still Cloudinary or S3 (uploads go to storage that isn't tied to the container at all) — let me know and I'll switch it over, it just needs an account/API key from you.

**Step 3 — Point the frontend at the real backend URL.**
1. Edit `frontend/src/environments/environment.prod.ts`: set `apiUrl` and `fileBaseUrl` to your actual Render URL from step 2 (not the placeholder currently checked in).
2. Commit and push that change.

**Step 4 — Frontend on Vercel.**
1. Vercel dashboard → **Add New → Project**, import `fevafest/feva`.
2. Set **Root Directory** to `frontend`. Vercel will pick up `frontend/vercel.json` for the build command, output directory (`dist/frontend/browser`), and SPA rewrites automatically.
3. Deploy. Vercel gives you a URL like `https://feva.vercel.app`.

**Step 5 — Close the loop.**
1. Back in Render → your service → Environment: set `CLIENT_URL` to the Vercel URL from step 4, and `PAYHERO_CALLBACK_URL` to `https://feva-fest-api.onrender.com/api/payments/payhero/callback`. Save (Render redeploys automatically).
2. Log in to PayHero's dashboard and make sure the same callback URL is whitelisted/configured there if PayHero requires that.
3. Visit the Vercel URL and confirm you can browse events, register, and log in — that confirms CORS and the API URL are wired correctly end-to-end.

**Seeding admins on the real database:** done — `npm run seed:admin` (`backend/src/utils/seedAdmins.js`) was run against your Atlas URI and created one superadmin, without touching/wiping anything else. It's safe to run again any time (idempotent — it only reports back if the account already exists) and never deletes data, unlike `npm run seed` (which wipes and reseeds demo events/blog/users and should only ever be run against a throwaway/test database, never this one). To create additional admins going forward, log in as the superadmin and use **Admin → Admins** instead of running scripts.

**Security checklist before going live**
- Rotate `JWT_SECRET` if you ever set one manually instead of using Render's auto-generated value.
- Confirm CORS (`CLIENT_URL` on Render) is locked to your real Vercel origin only.
- Confirm rate limiting (`express-rate-limit`) is active on `/api/auth` and `/api/payments` (enabled by default).
- Real PayHero credentials + a public `PAYHERO_CALLBACK_URL` are required before payments will actually work — see section 4.

## What's Needed To Go Live

- ✅ **Code pushed to GitHub** — `https://github.com/fevafest/feva.git`, `main` branch.
- ✅ **MongoDB connected** and a superadmin account created on it (`admin@fevafest.co.ke` — password was shown once when created; change it from Admin → Settings after first login).
- ⏳ **Deploy backend to Render** and **frontend to Vercel** — see section 10 for the exact steps (`render.yaml` and `frontend/vercel.json` are already in the repo to make this closer to one-click).
- ⏳ **Update `frontend/src/environments/environment.prod.ts`** with the real Render URL once it exists (currently a placeholder), then push again.
- ⏳ **Real PayHero credentials** (`PAYHERO_USERNAME`, `PAYHERO_PASSWORD`, `PAYHERO_CHANNEL_ID`) and a public HTTPS `PAYHERO_CALLBACK_URL` — see section 4.
- ⏳ **SMTP credentials** for `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` — see the emailing recommendation earlier (Brevo). Without this, tickets still generate correctly, they just won't be emailed.
- **Optional — persistent file storage:** free Render tier wipes uploaded images on redeploy; fixed by a Persistent Disk on a paid plan (steps in section 10) or by moving uploads to Cloudinary/S3 — either works, your call.
- **Optional — SMS OTP login instead of password login:** the current phone login still requires a password (just like email login). If you'd rather have players receive a one-time code by SMS instead, that needs a paid SMS gateway (e.g. Africa's Talking or Twilio) and its API key — let me know and I'll wire it in.

## Tech Stack

- **Frontend:** Angular 22 (standalone components, signals), SCSS, `qr-scanner`
- **Backend:** Node.js, Express, Mongoose
- **Auth:** JWT + bcrypt password hashing, role-based middleware (`customer`, `organizer`, `admin`, `staff`)
- **Payments:** PayHero M-Pesa STK Push, HTTP Basic Auth, asynchronous callback confirmation
- **QR Codes:** `qrcode` (server-side generation), `qr-scanner` (client-side camera scanning)
- **Email:** `nodemailer` over SMTP (provider-agnostic)
