const { customAlphabet } = require('nanoid');

const nanoidNumeric = customAlphabet('0123456789', 6);
const nanoidAlphaNum = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function generateOrderNumber() {
  return `FF-${Date.now().toString().slice(-6)}${nanoidNumeric()}`;
}

function generatePaymentReference() {
  return `FEVA-${nanoidAlphaNum()}`;
}

function generateTicketId() {
  return `TKT-${nanoidAlphaNum()}-${nanoidNumeric()}`;
}

/** Human-readable affiliate code, e.g. "DJKMANDE-7X2K", used in ?ref= links. */
function generateAffiliateCode(displayName) {
  const base =
    String(displayName || 'FEVA')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10) || 'FEVA';
  return `${base}-${nanoidAlphaNum().slice(0, 4)}`;
}

module.exports = {
  generateOrderNumber,
  generatePaymentReference,
  generateTicketId,
  generateAffiliateCode,
};
