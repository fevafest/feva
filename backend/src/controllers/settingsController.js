const Settings = require('../models/Settings');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { getSettings, invalidate } = require('../services/settingsService');

const EDITABLE_FIELDS = [
  'platformFeePercent',
  'platformFeeFixed',
  'affiliateDefaultCommissionPercent',
  'contactEmail',
  'contactPhone',
  'siteTagline',
  'clientUrl',
  'currency',
];

/** Public: safe operational settings for footer, help page, and currency */
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return success(res, 200, 'Settings fetched.', {
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    siteTagline: settings.siteTagline,
    currency: settings.currency || 'KES',
  });
});

/** Admin: full settings document. */
const adminGetSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return success(res, 200, 'Settings fetched.', settings);
});

/** Admin: update any subset of the editable platform settings. */
const adminUpdateSettings = asyncHandler(async (req, res) => {
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No valid settings fields were provided.');
  }

  if (updates.platformFeePercent !== undefined) {
    const v = Number(updates.platformFeePercent);
    if (Number.isNaN(v) || v < 0 || v > 1) {
      throw new ApiError(400, 'platformFeePercent must be between 0 and 1 (e.g. 0.05 for 5%).');
    }
  }
  if (updates.affiliateDefaultCommissionPercent !== undefined) {
    const v = Number(updates.affiliateDefaultCommissionPercent);
    if (Number.isNaN(v) || v < 0 || v > 100) {
      throw new ApiError(400, 'affiliateDefaultCommissionPercent must be between 0 and 100.');
    }
  }

  let settings = await Settings.findOne();
  if (!settings) settings = new Settings();
  Object.assign(settings, updates);
  await settings.save();
  invalidate();

  return success(res, 200, 'Settings updated successfully.', settings);
});

module.exports = { getPublicSettings, adminGetSettings, adminUpdateSettings };
