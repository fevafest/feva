const Ticket = require('../models/Ticket');
const { generateTicketId } = require('../utils/generateReference');
const { buildQrPayload, generateQrImage } = require('./qrService');

/**
 * Generates one Ticket document per unit quantity across all order items.
 * Idempotent: if tickets already exist for this order, returns them instead
 * of creating duplicates (guards against duplicate PayHero callbacks).
 */
async function generateTicketsForOrder(order) {
  const existing = await Ticket.find({ order: order._id });
  if (existing.length > 0) {
    return existing;
  }

  const tickets = [];
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      const ticketId = generateTicketId();
      const qrData = buildQrPayload({
        ticketId,
        eventId: order.event.toString(),
        orderId: order._id.toString(),
      });
      const qrCodeImage = await generateQrImage(qrData);

      tickets.push({
        ticketId,
        order: order._id,
        user: order.user,
        event: order.event,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item.ticketTypeName,
        price: item.unitPrice,
        qrData,
        qrCodeImage,
        status: 'VALID',
      });
    }
  }

  return Ticket.insertMany(tickets, { ordered: true });
}

module.exports = { generateTicketsForOrder };
