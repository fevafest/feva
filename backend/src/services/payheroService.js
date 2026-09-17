const axios = require('axios');

/**
 * PayHero integration (https://docs.payhero.africa/).
 *
 * PayHero uses HTTP Basic Authentication (username/password issued from your
 * PayHero dashboard) and an asynchronous flow: you POST to the STK push
 * endpoint with a callback_url, PayHero immediately acknowledges the request
 * with a QUEUED status, then later POSTs the final result to your
 * callback_url (see paymentController.payheroCallback).
 *
 * Request/response shapes below are taken directly from PayHero's official
 * "Initiate MPESA STK Push" docs.
 */

const BASE_URL = process.env.PAYHERO_API_BASE_URL || 'https://backend.payhero.co.ke/api/v2';
const USERNAME = process.env.PAYHERO_USERNAME;
const PASSWORD = process.env.PAYHERO_PASSWORD;
const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
const CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL;

function getAuthHeader() {
  const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  return `Basic ${token}`;
}

function isConfigured() {
  return Boolean(USERNAME && PASSWORD && CHANNEL_ID);
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

/**
 * Initiates an M-Pesa STK push via PayHero: POST /payments.
 * @param {{ amount: number, phoneNumber: string, reference: string, customerName?: string }} params
 * @returns {Promise<{ success: boolean, status: string, reference: string, CheckoutRequestID: string }>}
 */
async function initiateStkPush({ amount, phoneNumber, reference, customerName }) {
  if (!isConfigured()) {
    const err = new Error(
      'PayHero is not configured. Set PAYHERO_USERNAME, PAYHERO_PASSWORD and PAYHERO_CHANNEL_ID in the backend .env file.'
    );
    err.code = 'PAYHERO_NOT_CONFIGURED';
    throw err;
  }

  const payload = {
    amount: Math.round(amount),
    phone_number: toLocalFormat(phoneNumber),
    channel_id: Number(CHANNEL_ID),
    provider: 'm-pesa',
    external_reference: reference,
    callback_url: CALLBACK_URL,
    ...(customerName ? { customer_name: customerName } : {}),
  };

  const response = await client.post('/payments', payload, {
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

/** Converts any Kenyan phone format to the local 07XXXXXXXX / 01XXXXXXXX
 * format used in PayHero's documented request examples. */
function toLocalFormat(phoneNumber) {
  let digits = String(phoneNumber).replace(/\D/g, '');
  if (digits.startsWith('254')) digits = `0${digits.slice(3)}`;
  else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) digits = `0${digits}`;
  return digits;
}

module.exports = { initiateStkPush, isConfigured, toLocalFormat };
