const Settings = require('../models/Settings');

/**
 * Settings are read on nearly every order/checkout request, so they're
 * cached in memory for a short window rather than hitting MongoDB every
 * time. invalidate() is called right after an admin saves a change so the
 * new values take effect immediately rather than waiting out the cache.
 */
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
