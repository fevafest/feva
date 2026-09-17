/**
 * Normalizes Kenyan phone numbers to the canonical 2547XXXXXXXX / 2541XXXXXXXX
 * MSISDN format, so the same number always matches in the database regardless
 * of how a user typed it (0712345678, 254712345678, +254712345678, etc).
 * Returns null if the input doesn't look like a valid Kenyan mobile number.
 */
function normalizeKenyanPhone(input) {
  if (!input) return null;
  let digits = String(input).trim().replace(/[^\d]/g, '');

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  } else if (digits.startsWith('254') && digits.length === 12) {
    // already canonical
  } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = `254${digits}`;
  } else {
    return null;
  }

  return /^254[71]\d{8}$/.test(digits) ? digits : null;
}

/** True if the string looks like an email address rather than a phone number. */
function looksLikeEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

module.exports = { normalizeKenyanPhone, looksLikeEmail };
