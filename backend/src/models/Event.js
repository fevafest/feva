const mongoose = require('mongoose');
const slugify = require('slugify');

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Early Bird, Regular, VIP, VVIP
    price: { type: Number, required: true, min: 0 },
    quantityTotal: { type: Number, required: true, min: 0 },
    quantitySold: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
    salesStart: { type: Date },
    salesEnd: { type: Date },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    category: {
      type: String,
      enum: [
        'Music',
        'Festivals',
        'Concerts',
        'Sports',
        'Comedy',
        'Nightlife',
        'Conferences',
        'Food & Lifestyle',
        'Other',
      ],
      default: 'Other',
    },
    description: { type: String, required: true },
    posterImage: { type: String, required: true },
    gallery: [{ type: String }],
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true }, // city
    address: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    startTime: { type: String, required: true }, // e.g. "10:00 AM"
    endTime: { type: String },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    ticketTypes: [ticketTypeSchema],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'unpublished', 'cancelled'],
      default: 'draft',
    },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', location: 'text', venue: 'text' });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });

eventSchema.pre('validate', function generateSlug(next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }
  next();
});

eventSchema.virtual('minPrice').get(function getMinPrice() {
  if (!this.ticketTypes || this.ticketTypes.length === 0) return 0;
  return Math.min(...this.ticketTypes.map((t) => t.price));
});

eventSchema.virtual('totalAvailable').get(function getTotalAvailable() {
  if (!this.ticketTypes) return 0;
  return this.ticketTypes.reduce((sum, t) => sum + Math.max(t.quantityTotal - t.quantitySold, 0), 0);
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
