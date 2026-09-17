const Settings = require('../models/Settings');

const CACHE_TTL_MS = 30_000;
let cached = null;
let cachedAt = 0;

async function getSettings() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.05'),
      platformFeeFixed: parseFloat(process.env.PLATFORM_FEE_FIXED || '0'),
      affiliateDefaultCommissionPercent: parseFloat(
        process.env.AFFILIATE_DEFAULT_COMMISSION_PERCENT || '10'
      ),
      contactEmail: process.env.CONTACT_EMAIL || 'support@fevafest.co.ke',
      contactPhone: process.env.CONTACT_PHONE || '+254700000000',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
      currency: 'KES',
    });
  }

  cached = settings;
  cachedAt = now;
  return settings;
}

function invalidate() {
  cached = null;
}

module.exports = { getSettings, invalidate };
