const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    reference: { type: String, required: true, unique: true, index: true },
    provider: { type: String, default: 'PayHero' },
    amount: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    channel: { type: String, default: 'mpesa' },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    payheroCheckoutRequestId: { type: String },
    payheroTransactionId: { type: String },
    rawInitiateResponse: { type: mongoose.Schema.Types.Mixed },
    rawCallbackResponse: { type: mongoose.Schema.Types.Mixed },
    resultDescription: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
