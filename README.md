# Revytal Automated Checkout

A full-stack Next.js application that lets clinicians recommend products and instantly generate Stripe-powered QR checkout codes for patients — with automatic supplier routing on payment.

---

## How It Works

1. **Clinician types** a product name (e.g. "knee brace")
2. System **queries Google Sheets** and returns matching SKUs
3. Clinician **selects a SKU** → app creates a Stripe Checkout Session + QR code
4. Clinician **shows QR code** to patient on screen
5. Patient **scans QR → pays via Stripe**
6. Webhook fires → order logged to Supabase → **supplier email sent automatically**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TailwindCSS |
| Product DB | Google Sheets API v4 |
| Payments | Stripe Checkout + Webhooks |
| Order DB | Supabase (Postgres) |
| Email | Nodemailer (SMTP) |
| QR Codes | `qrcode` npm package |

---

## Project Structure

```
revytal/
├── app/
│   ├── api/
│   │   ├── search-products/route.ts   # GET ?q= → queries Google Sheets
│   │   ├── create-checkout/route.ts   # POST → Stripe session + QR code
│   │   └── webhook/route.ts           # Stripe webhook handler
│   ├── order-success/page.tsx         # Patient lands here after payment
│   ├── layout.tsx
│   ├── page.tsx                       # Main 3-screen UI (Search → Results → QR)
│   └── globals.css
├── lib/
│   ├── sheets.ts                      # Google Sheets product lookup
│   ├── stripe.ts                      # Stripe session creation
│   ├── supabase.ts                    # Order logging
│   └── email.ts                       # Supplier email routing
├── supabase-migration.sql             # Run once in Supabase SQL editor
├── .env.local.example                 # All required environment variables
└── README.md
```

---

## Setup Guide

### 1. Install Dependencies

```bash
cd revytal
npm install
```

### 2. Copy and Fill Environment Variables

```bash
cp .env.local.example .env.local
```

Then fill in each value (see sections below).

---

### 3. Google Sheets Setup

**Sheet structure** — create a tab named `products` with these exact column headers in row 1:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| product_name | sku | supplier | price | cost | url | tags |

- **tags** column: comma-separated keywords (e.g. `knee brace, knee, brace, support`)
- **supplier** column: must match one of the keys in `lib/email.ts` (e.g. `MeyerPT`, `Brace Direct`)
- **price** / **cost**: plain numbers (e.g. `49.99`)

**Create a Service Account:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → enable **Google Sheets API**
3. Create a **Service Account** → download JSON key
4. Share your Google Sheet with the service account email (viewer access)
5. Paste the entire JSON key (as one line) into `GOOGLE_SERVICE_ACCOUNT_JSON`

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

The Sheet ID is the long string in the URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

---

### 4. Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your keys from the Stripe Dashboard → Developers → API Keys

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Webhook Setup:**
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the **Signing Secret**:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**For local testing** use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

---

### 5. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-migration.sql` in your Supabase SQL editor (creates the `orders` table)
3. Copy your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Settings → API → service_role key
```

---

### 6. Email (SMTP) Setup

The app uses Nodemailer. Any SMTP provider works (Gmail, SendGrid, Postmark, etc.).

**Gmail example** (use an App Password, not your real password):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=orders@yourpractice.com
SMTP_PASS=your_16_char_app_password
```

**Supplier email addresses:**
```env
SUPPLIER_EMAIL_MEYERPT=orders@meyerpt.com
SUPPLIER_EMAIL_BRACE_DIRECT=orders@bracedirect.com
```

---

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Adding New Suppliers

1. Add their email to `.env.local`:
   ```env
   SUPPLIER_EMAIL_ACME=orders@acme.com
   ```

2. Register them in `lib/email.ts` in the `SUPPLIER_EMAILS` map:
   ```ts
   const SUPPLIER_EMAILS: Record<string, string> = {
     meyerpt:      process.env.SUPPLIER_EMAIL_MEYERPT ?? '...',
     bracedirect:  process.env.SUPPLIER_EMAIL_BRACE_DIRECT ?? '...',
     acme:         process.env.SUPPLIER_EMAIL_ACME ?? '...',   // ← add this
   };
   ```

3. In your Google Sheet, set the `supplier` column to `acme` (case-insensitive) for those products.

That's it — no other code changes needed.

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Make sure `NEXT_PUBLIC_APP_URL` is set to your production domain so Stripe redirects work:
```env
NEXT_PUBLIC_APP_URL=https://checkout.yourpractice.com
```

---

## Order Flow Diagram

```
Clinician types query
        ↓
GET /api/search-products?q=...
        ↓
Google Sheets → filtered product rows
        ↓
Clinician clicks "Select"
        ↓
POST /api/create-checkout
  → Stripe: create Checkout Session
  → QRCode: encode checkout URL
  → Supabase: insert order (status: "pending")
        ↓
QR code displayed full-screen
        ↓
Patient scans + pays
        ↓
Stripe fires webhook → POST /api/webhook
  → Supabase: update order (status: "paid")
  → Nodemailer: email supplier
  → Supabase: update order (status: "sent_to_supplier")
```

---

## Database Schema

```sql
orders (
  id                uuid PRIMARY KEY,
  product_name      text,
  sku               text,
  supplier          text,
  price             numeric(10,2),
  cost              numeric(10,2),
  margin            numeric(10,2),   -- computed: price - cost
  checkout_url      text,
  qr_code_url       text,
  patient_email     text,
  patient_address   text,
  status            text,            -- pending | paid | sent_to_supplier
  stripe_session_id text UNIQUE,
  created_at        timestamptz
)
```

---

## Supplier Email Format

**Subject:** `New Revytal Order – SKU-12345`

**Body includes:**
- Product name & SKU
- Supplier name
- Order ID (Stripe session ID)
- Amount paid
- Patient's full shipping address
- Patient's email

---

## License

MIT — build freely.
