const mongoose = require('mongoose');

/**
 * Single-document collection holding platform settings that admins can edit
 * from Admin -> Settings without needing a redeploy. Secrets (JWT, PayHero
 * credentials, SMTP credentials, the database URI) intentionally stay in
 * environment variables, never here — only non-secret operational settings
 * belong in this model.
 */
const settingsSchema = new mongoose.Schema(
  {
    platformFeePercent: { type: Number, default: 0.05, min: 0, max: 1 },
    platformFeeFixed: { type: Number, default: 0, min: 0 },
    affiliateDefaultCommissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    contactEmail: { type: String, default: 'support@fevafest.co.ke', trim: true },
    contactPhone: { type: String, default: '+254700000000', trim: true },
    siteTagline: { type: String, default: 'Every stage. Every crowd. One tap to get in.', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
