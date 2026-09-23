const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { verifyQrPayload } = require('../services/qrService');

const myTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id })
    .populate('event', 'title slug posterImage venue location startDate startTime')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Tickets fetched.', tickets);
});

const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId }).populate(
    'event',
    'title slug posterImage venue location startDate startTime'
  );
  if (!ticket) throw new ApiError(404, 'Ticket not found.');
  if (String(ticket.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this ticket.');
  }

  return success(res, 200, 'Ticket fetched.', ticket);
});

/**
 * Staff/Admin: scan a ticket QR code (payload string) and report validity.
 *
 * A manual ticket-ID lookup never mutates status, so staff can inspect a
 * ticket without burning it. A camera scan passes `consume`, which checks the
 * ticket in atomically — the same QR presented twice can never both come back
 * valid, even if two doors scan it at the same moment.
 */
const verifyTicket = asyncHandler(async (req, res) => {
  const { qrData, ticketId, consume } = req.body;

  let ticket;
  if (ticketId) {
    ticket = await Ticket.findOne({ ticketId });
  } else if (qrData) {
    const parsed = verifyQrPayload(qrData);
    if (!parsed) {
      return success(res, 200, 'Invalid ticket.', { valid: false, reason: 'INVALID_SIGNATURE' });
    }
    ticket = await Ticket.findOne({ ticketId: parsed.ticketId });
  } else {
    throw new ApiError(400, 'ticketId or qrData is required.');
  }

  if (!ticket) {
    return success(res, 200, 'Invalid ticket.', { valid: false, reason: 'NOT_FOUND' });
  }

  await ticket.populate([
    { path: 'event', select: 'title venue location startDate startTime' },
    { path: 'user', select: 'fullName email phoneNumber' },
  ]);

  if (ticket.status === 'USED') {
    return success(res, 200, 'Ticket already used.', {
      valid: false,
      reason: 'ALREADY_USED',
      ticket,
    });
  }

  if (ticket.status === 'CANCELLED') {
    return success(res, 200, 'Ticket cancelled.', { valid: false, reason: 'CANCELLED', ticket });
  }

  if (consume) {
    const claimed = await Ticket.findOneAndUpdate(
      { _id: ticket._id, status: 'VALID' },
      { status: 'USED', usedAt: new Date(), scannedBy: req.user._id },
      { new: true }
    );
    // Losing the race means another scanner admitted this ticket first.
    if (!claimed) {
      return success(res, 200, 'Ticket already used.', { valid: false, reason: 'ALREADY_USED', ticket });
    }
    ticket.status = claimed.status;
    ticket.usedAt = claimed.usedAt;
    return success(res, 200, 'Ticket valid. Checked in.', { valid: true, checkedIn: true, ticket });
  }

  return success(res, 200, 'Ticket valid.', { valid: true, ticket });
});

/**
 * Staff/Admin: mark a valid ticket as USED at the door.
 * Uses an atomic findOneAndUpdate guarded by status: 'VALID' so that two
 * near-simultaneous scans of the same QR code can never both succeed —
 * whichever request wins the update flips the status first, and the loser
 * always sees the ticket already marked USED.
 */
const markTicketUsed = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOneAndUpdate(
    { ticketId: req.params.ticketId, status: 'VALID' },
    { status: 'USED', usedAt: new Date(), scannedBy: req.user._id },
    { new: true }
  );

  if (ticket) {
    return success(res, 200, 'Ticket marked as used.', ticket);
  }

  const existing = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!existing) throw new ApiError(404, 'Ticket not found.');
  if (existing.status === 'USED') throw new ApiError(409, 'This ticket has already been used.');
  throw new ApiError(409, 'This ticket has been cancelled and cannot be used.');
});

/** Admin: list every ticket on the platform with filters and pagination. */
const adminListTickets = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (search) query.ticketId = { $regex: search, $options: 'i' };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate('event', 'title venue')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Ticket.countDocuments(query),
  ]);

  return success(res, 200, 'Tickets fetched.', tickets, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * Admin: delete a spent ticket. Only a USED ticket can be removed — deleting
 * a VALID one would silently revoke admission the holder has paid for.
 */
const adminDeleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) throw new ApiError(404, 'Ticket not found.');

  if (ticket.status !== 'USED') {
    throw new ApiError(409, 'Only tickets that have already been used can be deleted.');
  }

  await ticket.deleteOne();
  await Order.updateOne({ _id: ticket.order }, { $pull: { tickets: ticket._id } });

  return success(res, 200, 'Ticket deleted.', { ticketId: req.params.ticketId });
});

module.exports = {
  myTickets,
  getTicketById,
  verifyTicket,
  markTicketUsed,
  adminListTickets,
  adminDeleteTicket,
};
