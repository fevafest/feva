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

## 10. Production Deployment

**Backend**
1. Provision a MongoDB instance (Atlas recommended) and a Node hosting target (e.g. a VPS, Render, Railway, Fly.io).
2. Set all variables from `.env.example` as real environment variables on the host — never commit `.env`.
3. Set `NODE_ENV=production`, `CLIENT_URL` to your deployed frontend's origin, and real PayHero credentials + a public `PAYHERO_CALLBACK_URL`.
4. Run `npm install --omit=dev` then `npm start` (or run behind a process manager like `pm2`).
5. Put the API behind HTTPS (a reverse proxy such as Nginx or your host's managed TLS) — required for PayHero callbacks and for camera access in the ticket scanner.

**Frontend**
1. Edit `frontend/src/environments/environment.prod.ts` if your API is not served from the same origin/reverse-proxy path as the frontend.
2. `npm run build` and deploy the contents of `frontend/dist/frontend` to any static host (Nginx, Netlify, Vercel, S3+CloudFront, etc.), or serve it from the same Node process behind a reverse proxy.
3. Configure your web server to fall back to `index.html` for unknown paths (SPA routing) — e.g. Nginx `try_files $uri /index.html;`.

**Security checklist before going live**
- Rotate `JWT_SECRET` to a long random value distinct from any development value.
- Confirm CORS (`CLIENT_URL`) is locked to your real frontend origin only.
- Confirm rate limiting (`express-rate-limit`) is active on `/api/auth` and `/api/payments` (enabled by default).
- Confirm the uploads directory (`backend/uploads`) is served read-only and that file upload size limits (5MB, images only) remain in place.

## What's Needed To Go Live

- **SMTP credentials** for `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` in `backend/.env` — any provider works (Gmail app password, SendGrid, Mailgun, Resend, AWS SES). Without this, tickets still generate correctly, they just won't be emailed.
- **Real PayHero credentials** (`PAYHERO_USERNAME`, `PAYHERO_PASSWORD`, `PAYHERO_CHANNEL_ID`) and a public HTTPS `PAYHERO_CALLBACK_URL` — see section 4.
- **A persistent MongoDB** (Atlas is easiest) — the copy running during development in this session used a temporary in-memory database and will lose its data when the process stops.
- **A first superadmin** — created for you by `npm run seed` (`admin@fevafest.co.ke`). In production, create this one account directly via the seed script or MongoDB before disabling seeding.
- **Optional — SMS OTP login instead of password login:** the current phone login still requires a password (just like email login). If you'd rather have players receive a one-time code by SMS instead, that needs a paid SMS gateway (e.g. Africa's Talking or Twilio) and its API key — let me know and I'll wire it in.

## Tech Stack

- **Frontend:** Angular 22 (standalone components, signals), SCSS, `qr-scanner`
- **Backend:** Node.js, Express, Mongoose
- **Auth:** JWT + bcrypt password hashing, role-based middleware (`customer`, `organizer`, `admin`, `staff`)
- **Payments:** PayHero M-Pesa STK Push, HTTP Basic Auth, asynchronous callback confirmation
- **QR Codes:** `qrcode` (server-side generation), `qr-scanner` (client-side camera scanning)
- **Email:** `nodemailer` over SMTP (provider-agnostic)
