const nodemailer = require('nodemailer');

/**
 * Generic SMTP-based email delivery. Works with any provider (Gmail app
 * password, SendGrid/Mailgun/Resend SMTP relay, Mailtrap for testing, AWS SES
 * SMTP, etc) — just set the EMAIL_* environment variables. If they are not
 * set, email sending is skipped (logged, not thrown) so the rest of the
 * purchase flow never breaks because of missing email configuration.
 */

let transporter = null;

function isConfigured() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isConfigured()) return null;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
}

/**
 * Emails the customer their tickets (with embedded QR codes) after a
 * confirmed payment. Failures are logged, never thrown — a missing/broken
 * email provider must not affect ticket generation or the order status.
 */
async function sendTicketEmail({ to, fullName, event, tickets, orderNumber }) {
  const client = getTransporter();
  if (!client) {
    console.warn(
      `[emailService] Email not configured — skipped sending tickets for order ${orderNumber} to ${to}.`
    );
    return { sent: false, reason: 'NOT_CONFIGURED' };
  }

  const attachments = tickets.map((ticket, index) => ({
    filename: `${ticket.ticketId}.png`,
    content: ticket.qrCodeImage.split('base64,')[1],
    encoding: 'base64',
    cid: `qr-${index}`,
  }));

  const ticketRows = tickets
    .map(
      (ticket, index) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #eee;">
          <p style="margin:0 0 4px;font-weight:700;color:#14141a;">${ticket.ticketTypeName}</p>
          <p style="margin:0;font-family:monospace;font-size:13px;color:#6b7280;">${ticket.ticketId}</p>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid #eee;text-align:right;">
          <img src="cid:qr-${index}" width="110" height="110" alt="Ticket QR code" style="border:1px solid #e6e6ea;border-radius:8px;" />
        </td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#14141a;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:22px;font-weight:800;color:#e21221;">FEVA</span><span style="font-size:22px;font-weight:800;">FEST</span>
    </div>
    <h2 style="text-align:center;margin-bottom:4px;">Your tickets are confirmed!</h2>
    <p style="text-align:center;color:#6b7280;margin-top:0;">Order ${orderNumber}</p>

    <div style="background:#f4f4f6;border-radius:12px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 4px;font-weight:700;">${event.title}</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">${event.venue}, ${event.location}</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">${event.startDate} &middot; ${event.startTime}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;">
      ${ticketRows}
    </table>

    <p style="color:#6b7280;font-size:13px;margin-top:24px;">
      Present the QR code for each ticket at the entrance. Each code can only be scanned once —
      please don't share screenshots of your tickets with anyone else.
    </p>
    <p style="color:#6b7280;font-size:13px;">Hi ${fullName}, thank you for booking with FEVA FEST.</p>
  </div>`;

  try {
    await client.sendMail({
      from: process.env.EMAIL_FROM || `FEVA FEST <no-reply@fevafest.co.ke>`,
      to,
      subject: `Your FEVA FEST tickets for ${event.title}`,
      html,
      attachments,
    });
    return { sent: true };
  } catch (err) {
    console.error('[emailService] Failed to send ticket email:', err.message);
    return { sent: false, reason: 'SEND_FAILED', error: err.message };
  }
}

module.exports = { sendTicketEmail, isConfigured };
