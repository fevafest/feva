const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['influencer', 'dj', 'promoter', 'brand', 'other'],
      default: 'other',
    },
    bio: { type: String, trim: true },
    socialLinks: {
      instagram: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      twitter: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    // Applied whenever there's no event-specific override (see AffiliateEventRate).
    defaultCommissionPercent: { type: Number, required: true, min: 0, max: 100 },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    totalClicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

affiliateSchema.index({ isApproved: 1, isActive: 1 });

module.exports = mongoose.model('Affiliate', affiliateSchema);
