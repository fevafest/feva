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

module.exports = { generateOrderNumber, generatePaymentReference, generateTicketId };
