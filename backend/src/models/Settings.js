const mongoose = require('mongoose');

/**
 * Single-document collection holding operational and integration settings
 * that admins can manage directly from Admin -> Settings without editing .env.
 */
const settingsSchema = new mongoose.Schema(
  {
    // Platform Fees & Affiliate Defaults
    platformFeePercent: { type: Number, default: 0.05, min: 0, max: 1 },
    platformFeeFixed: { type: Number, default: 0, min: 0 },
    affiliateDefaultCommissionPercent: { type: Number, default: 10, min: 0, max: 100 },

    // General & Contact
    contactEmail: { type: String, default: 'support@fevafest.co.ke', trim: true },
    contactPhone: { type: String, default: '+254700000000', trim: true },
    siteTagline: { type: String, default: 'Every stage. Every crowd. One tap to get in.', trim: true },
    clientUrl: { type: String, trim: true },
    currency: { type: String, default: 'KES', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
