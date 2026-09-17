const mongoose = require('mongoose');

/**
 * Per-event commission rate override for a specific affiliate. When one of
 * these doesn't exist for an (affiliate, event) pair, the affiliate's
 * defaultCommissionPercent is used instead (see paymentController).
 */
const affiliateEventRateSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

affiliateEventRateSchema.index({ affiliate: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('AffiliateEventRate', affiliateEventRateSchema);
