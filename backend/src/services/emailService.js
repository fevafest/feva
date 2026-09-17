const nodemailer = require('nodemailer');

/**
 * Generic SMTP-based email delivery configured via server .env:
 * EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 */
function getEmailConfig() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || 'FEVA FEST <no-reply@fevafest.co.ke>';
  return { host, port, secure, user, pass, from };
}

async function getTransporter() {
  const cfg = getEmailConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) return null;

  return {
    client: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    }),
    from: cfg.from,
  };
}

/**
 * Emails the customer their tickets (with embedded QR codes) after a confirmed payment.
 */
async function sendTicketEmail({ to, fullName, event, tickets, orderNumber }) {
  const transport = await getTransporter();
  if (!transport) {
    console.warn(
      `[emailService] Email not configured or delivery disabled — skipped sending tickets for order ${orderNumber} to ${to}.`
    );
    return { sent: false, reason: 'NOT_CONFIGURED' };
  }

  const { client, from } = transport;

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
          <div style="margin-top:12px;">
            <img src="cid:qr-${index}" alt="Ticket QR code" width="160" height="160" style="display:block;border-radius:6px;border:1px solid #e5e7eb;" />
          </div>
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f9fafb;margin:0;padding:24px;color:#1f2937;">
        <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#f2540c;padding:24px;color:#fff;">
            <h1 style="margin:0;font-size:22px;letter-spacing:0.5px;">FEVA FEST</h1>
            <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">Your tickets are confirmed &bull; Order #${orderNumber}</p>
          </div>
          <div style="padding:28px 24px;">
            <p style="font-size:16px;margin:0 0 16px;">Hi <strong>${fullName || 'there'}</strong>,</p>
            <p style="font-size:14px;line-height:1.5;margin:0 0 20px;">
              You're all set for <strong>${event.title}</strong> on ${new Date(
    event.startDate
  ).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} at <strong>${event.venue}, ${event.location}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${ticketRows}
            </table>
            <p style="font-size:13px;color:#6b7280;margin:24px 0 0;line-height:1.4;">
              Show these QR codes on your phone at the entrance. Each code can only be scanned once.
            </p>
          </div>
          <div style="background:#f3f4f6;padding:16px 24px;font-size:12px;color:#9ca3af;text-align:center;">
            FEVA FEST &bull; Kenya's modern marketplace for tickets, flights and holidays.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await client.sendMail({
      from,
      to,
      subject: `Your tickets for ${event.title} [Order #${orderNumber}]`,
      html,
      attachments,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[emailService] Failed to send ticket email to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendTicketEmail };
