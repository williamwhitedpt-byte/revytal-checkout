import nodemailer from 'nodemailer';

// ─── Supplier registry ────────────────────────────────────────────────────────
// To add a new supplier: add an entry to SUPPLIER_EMAILS below and ensure the
// supplier column in the Google Sheet exactly matches the key (case-insensitive).
const SUPPLIER_EMAILS: Record<string, string> = {
  meyerpt: process.env.SUPPLIER_EMAIL_MEYERPT ?? 'orders@meyerpt.com',
  'brace direct': process.env.SUPPLIER_EMAIL_BRACE_DIRECT ?? 'orders@bracedirect.com',
  bracedirect: process.env.SUPPLIER_EMAIL_BRACE_DIRECT ?? 'orders@bracedirect.com',
};

function resolveSupplierEmail(supplier: string): string | null {
  const key = supplier.toLowerCase().trim();
  return SUPPLIER_EMAILS[key] ?? null;
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface OrderEmailPayload {
  order_id: string;
  product_name: string;
  sku: string;
  supplier: string;
  patient_email?: string;
  patient_address?: string;
  amount: number; // dollars
}

export async function sendSupplierEmail(payload: OrderEmailPayload): Promise<void> {
  const to = resolveSupplierEmail(payload.supplier);

  if (!to) {
    console.warn(`[email] No email configured for supplier "${payload.supplier}" – skipping.`);
    return;
  }

  const transport = buildTransport();
  const formattedAmount = `$${payload.amount.toFixed(2)}`;
  const address = payload.patient_address ?? 'Not provided';

  const subject = `New Revytal Order – ${payload.sku}`;

  const text = `
New order received via Revytal Automated Checkout.

Product:  ${payload.product_name}
SKU:      ${payload.sku}
Supplier: ${payload.supplier}
Order ID: ${payload.order_id}
Paid:     ${formattedAmount}

Patient Shipping Address:
${address}

Patient Email: ${payload.patient_email ?? 'Not provided'}

—
This email was generated automatically by Revytal.
Please fulfill this order at your earliest convenience.
`.trim();

  const html = `
<div style="font-family: system-ui, sans-serif; max-width: 560px; color: #1a2e25;">
  <div style="background: #22a06b; padding: 20px 28px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -.3px;">
      New Revytal Order
    </h1>
    <p style="color: rgba(255,255,255,.8); margin: 4px 0 0; font-size: 14px;">SKU: ${payload.sku}</p>
  </div>
  <div style="border: 1px solid #e4ede8; border-top: none; border-radius: 0 0 8px 8px; padding: 24px 28px;">
    <table style="width:100%; border-collapse: collapse;">
      <tr><td style="padding:6px 0; color:#7a9488; font-size:13px; width:140px;">Product</td><td style="padding:6px 0; font-weight:600;">${payload.product_name}</td></tr>
      <tr><td style="padding:6px 0; color:#7a9488; font-size:13px;">SKU</td><td style="padding:6px 0; font-weight:600; font-family:monospace;">${payload.sku}</td></tr>
      <tr><td style="padding:6px 0; color:#7a9488; font-size:13px;">Supplier</td><td style="padding:6px 0; font-weight:600;">${payload.supplier}</td></tr>
      <tr><td style="padding:6px 0; color:#7a9488; font-size:13px;">Order ID</td><td style="padding:6px 0; font-size:12px; font-family:monospace;">${payload.order_id}</td></tr>
      <tr><td style="padding:6px 0; color:#7a9488; font-size:13px;">Paid Amount</td><td style="padding:6px 0; font-weight:700; color:#22a06b;">${formattedAmount}</td></tr>
    </table>
    <hr style="border:none; border-top:1px solid #e4ede8; margin:20px 0;" />
    <p style="color:#7a9488; font-size:13px; margin:0 0 8px;">Patient Shipping Address</p>
    <p style="margin:0; font-weight:600; white-space:pre-line;">${address}</p>
    ${payload.patient_email ? `<p style="margin:12px 0 0; color:#7a9488; font-size:13px;">Patient Email: <a href="mailto:${payload.patient_email}" style="color:#22a06b;">${payload.patient_email}</a></p>` : ''}
  </div>
  <p style="font-size:12px; color:#b8cdc5; margin-top:16px;">Generated automatically by Revytal Automated Checkout.</p>
</div>
`.trim();

  await transport.sendMail({
    from: `Revytal Orders <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });

  console.log(`[email] Supplier email sent to ${to} for order ${payload.order_id}`);
}
