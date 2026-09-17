const mongoose = require('mongoose');

/**
 * A commission is only ever created from the PayHero success callback (see
 * paymentController.payheroCallback), never from anything the frontend can
 * trigger directly — that's what makes it hard to fake. One commission per
 * order, enforced by the unique index below, so a retried/duplicate PayHero
 * callback can never double-pay an affiliate.
 */
const commissionSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    baseAmount: { type: Number, required: true }, // order.subtotal the % was applied to
    commissionPercent: { type: Number, required: true }, // rate actually applied, snapshotted
    commissionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AVAILABLE', 'PAID'],
      default: 'PENDING',
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

commissionSchema.index({ affiliate: 1, status: 1 });
commissionSchema.index({ affiliate: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', commissionSchema);
