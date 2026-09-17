const QRCode = require('qrcode');
const crypto = require('crypto');

function buildQrPayload({ ticketId, eventId, orderId }) {
  const secret = process.env.JWT_SECRET || 'feva-fest';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${ticketId}:${eventId}:${orderId}`)
    .digest('hex')
    .slice(0, 16);
  return JSON.stringify({ ticketId, eventId, orderId, sig: signature });
}

function verifyQrPayload(payloadString) {
  try {
    const payload = JSON.parse(payloadString);
    const { ticketId, eventId, orderId, sig } = payload;
    if (!ticketId || !eventId || !orderId || !sig) return null;
    const expected = buildQrPayload({ ticketId, eventId, orderId });
    const expectedSig = JSON.parse(expected).sig;
    if (expectedSig !== sig) return null;
    return { ticketId, eventId, orderId };
  } catch {
    return null;
  }
}

async function generateQrImage(dataString) {
  return QRCode.toDataURL(dataString, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#111111', light: '#ffffff' },
  });
}

module.exports = { buildQrPayload, verifyQrPayload, generateQrImage };
