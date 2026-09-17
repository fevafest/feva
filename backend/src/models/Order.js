const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ticketTypeName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    // Attribution captured at checkout time (from a ?ref=CODE link). Only
    // ever used to credit a commission once payment is confirmed — see
    // paymentController.payheroCallback.
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },
    affiliateCode: { type: String, trim: true, uppercase: true },
    items: [orderItemSchema],
    tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    fees: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    paymentReference: { type: String, required: true, unique: true, index: true },
    payheroReference: { type: String },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAYMENT_PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    paidAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ event: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ affiliate: 1, paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
