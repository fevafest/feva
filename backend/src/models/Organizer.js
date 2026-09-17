const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    logo: { type: String },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    website: { type: String, trim: true },
    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    totalRevenue: { type: Number, default: 0 },
    totalTicketsSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

organizerSchema.index({ user: 1 });

module.exports = mongoose.model('Organizer', organizerSchema);
