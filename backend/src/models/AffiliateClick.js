const mongoose = require('mongoose');

/** One row per tracked click on an affiliate link — kept lightweight so
 * conversion rate (tickets sold / clicks) can be computed per affiliate
 * and, optionally, per event. */
const affiliateClickSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

affiliateClickSchema.index({ affiliate: 1, createdAt: -1 });

module.exports = mongoose.model('AffiliateClick', affiliateClickSchema);
