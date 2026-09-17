const Organizer = require('../models/Organizer');
const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { getUploadedUrl } = require('../middleware/upload');

/** Registers the current user as an event organizer (pending admin approval). */
const registerOrganizer = asyncHandler(async (req, res) => {
  if (req.user.organizer) {
    throw new ApiError(409, 'You already have an organizer profile.');
  }

  const { businessName, description, contactEmail, contactPhone, website } = req.body;
  if (!businessName) throw new ApiError(400, 'Business name is required.');

  const organizer = await Organizer.create({
    user: req.user._id,
    businessName,
    description,
    contactEmail,
    contactPhone,
    website,
    logo: getUploadedUrl(req.file, 'organizers'),
  });

  const userUpdates = { organizer: organizer._id };
  if (!['admin', 'staff'].includes(req.user.role)) {
    userUpdates.role = 'organizer';
  }
  await User.findByIdAndUpdate(req.user._id, userUpdates);

  return success(res, 201, 'Organizer profile created. Awaiting admin approval.', organizer);
});

const getMyOrganizerProfile = asyncHandler(async (req, res) => {
  if (!req.user.organizer) throw new ApiError(404, 'No organizer profile found.');
  const organizer = await Organizer.findById(req.user.organizer);
  return success(res, 200, 'Organizer profile fetched.', organizer);
});

/** Organizer: sales/revenue/attendee summary across their events. */
const organizerStats = asyncHandler(async (req, res) => {
  if (!req.user.organizer) throw new ApiError(403, 'Organizer profile required.');

  const events = await Event.find({ organizer: req.user.organizer });
  const eventIds = events.map((e) => e._id);

  const paidOrders = await Order.find({ event: { $in: eventIds }, paymentStatus: 'PAID' });

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalTicketsSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);

  const perEvent = events.map((event) => {
    const eventOrders = paidOrders.filter((o) => String(o.event) === String(event._id));
    return {
      eventId: event._id,
      title: event.title,
      ticketsSold: eventOrders.reduce((sum, o) => sum + o.quantity, 0),
      revenue: eventOrders.reduce((sum, o) => sum + o.subtotal, 0),
      status: event.status,
    };
  });

  return success(res, 200, 'Organizer stats fetched.', {
    totalEvents: events.length,
    totalRevenue,
    totalTicketsSold,
    perEvent,
  });
});

/** Admin: list organizers, optionally filtered by approval status. */
const adminListOrganizers = asyncHandler(async (req, res) => {
  const { approved } = req.query;
  const query = {};
  if (approved === 'true') query.isApproved = true;
  if (approved === 'false') query.isApproved = false;

  const organizers = await Organizer.find(query)
    .populate('user', 'fullName email phoneNumber')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Organizers fetched.', organizers);
});

const adminApproveOrganizer = asyncHandler(async (req, res) => {
  const organizer = await Organizer.findById(req.params.id);
  if (!organizer) throw new ApiError(404, 'Organizer not found.');

  organizer.isApproved = true;
  organizer.isVerified = true;
  await organizer.save();

  return success(res, 200, 'Organizer approved.', organizer);
});

module.exports = {
  registerOrganizer,
  getMyOrganizerProfile,
  organizerStats,
  adminListOrganizers,
  adminApproveOrganizer,
};
