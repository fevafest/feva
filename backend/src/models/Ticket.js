const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true }, // public unique ticket ID
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    ticketTypeName: { type: String, required: true },
    price: { type: Number, required: true },
    qrData: { type: String, required: true }, // encoded payload string
    qrCodeImage: { type: String }, // data URL (base64 PNG)
    status: {
      type: String,
      enum: ['VALID', 'USED', 'CANCELLED'],
      default: 'VALID',
    },
    usedAt: { type: Date },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ticketSchema.index({ user: 1 });
ticketSchema.index({ event: 1 });
ticketSchema.index({ order: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
