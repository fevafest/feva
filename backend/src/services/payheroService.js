const axios = require('axios');

/**
 * PayHero integration (https://docs.payhero.africa/).
 *
 * Configured securely via server .env environment variables:
 * PAYHERO_CHANNEL_ID, PAYHERO_USERNAME, PAYHERO_PASSWORD, PAYHERO_API_BASE_URL, PAYHERO_CALLBACK_URL
 */

function getConfig() {
  const username = process.env.PAYHERO_USERNAME;
  const password = process.env.PAYHERO_PASSWORD;
  const channelId = process.env.PAYHERO_CHANNEL_ID;
  const baseUrl = process.env.PAYHERO_API_BASE_URL || 'https://backend.payhero.co.ke/api/v2';
  const callbackUrl = process.env.PAYHERO_CALLBACK_URL;
  return { username, password, channelId, baseUrl, callbackUrl };
}

/**
 * Initiates an M-Pesa STK push via PayHero: POST /payments.
 * @param {{ amount: number, phoneNumber: string, reference: string, customerName?: string }} params
 * @returns {Promise<{ success: boolean, status: string, reference: string, CheckoutRequestID: string }>}
 */
async function initiateStkPush({ amount, phoneNumber, reference, customerName }) {
  const { username, password, channelId, baseUrl, callbackUrl } = getConfig();

  if (!username || !password || !channelId) {
    const err = new Error(
      'PayHero is not configured. Please set PAYHERO_CHANNEL_ID, PAYHERO_USERNAME, and PAYHERO_PASSWORD in server .env.'
    );
    err.code = 'PAYHERO_NOT_CONFIGURED';
    throw err;
  }

  const token = Buffer.from(`${username}:${password}`).toString('base64');
  const payload = {
    amount: Math.round(amount),
    phone_number: toLocalFormat(phoneNumber),
    channel_id: Number(channelId),
    provider: 'm-pesa',
    external_reference: reference,
    callback_url: callbackUrl,
    ...(customerName ? { customer_name: customerName } : {}),
  };

  const response = await axios.post(`${baseUrl}/payments`, payload, {
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });

  return response.data;
}

/**
 * Normalizes any Kenyan phone number format into the 07XXXXXXXX format
 * PayHero's API expects.
 */
function toLocalFormat(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return digits;
  }
  return phone;
}

module.exports = { initiateStkPush };
