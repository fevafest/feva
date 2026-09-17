const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { getUploadedUrl } = require('../middleware/upload');

/** Public: list published events with search, filters and pagination. */
const listEvents = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    city,
    featured,
    promoted,
    page = 1,
    limit = 12,
    sort = 'startDate',
  } = req.query;

  const query = { status: 'published' };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;
  if (city) query.location = { $regex: city, $options: 'i' };
  if (featured === 'true') query.isFeatured = true;
  if (promoted === 'true') query.isPromoted = true;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const sortMap = {
    startDate: { startDate: 1 },
    newest: { createdAt: -1 },
    priceLow: { 'ticketTypes.0.price': 1 },
  };

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate('organizer', 'businessName logo isVerified')
      .sort(sortMap[sort] || sortMap.startDate)
      .skip(skip)
      .limit(limitNum),
    Event.countDocuments(query),
  ]);

  return success(res, 200, 'Events fetched.', events, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug }).populate(
    'organizer',
    'businessName logo description contactEmail contactPhone isVerified'
  );
  if (!event) throw new ApiError(404, 'Event not found.');

  if (event.status !== 'published') {
    const isOwnerOrAdmin =
      req.user &&
      (req.user.role === 'admin' ||
        (req.user.organizer && String(event.organizer._id) === String(req.user.organizer)));
    if (!isOwnerOrAdmin) throw new ApiError(404, 'Event not found.');
  }

  event.viewCount += 1;
  await event.save();

  return success(res, 200, 'Event fetched.', event);
});

const getEventCategories = asyncHandler(async (req, res) => {
  const categories = [
    'Music',
    'Festivals',
    'Concerts',
    'Sports',
    'Comedy',
    'Nightlife',
    'Conferences',
    'Food & Lifestyle',
  ];
  return success(res, 200, 'Categories fetched.', categories);
});

/** Organizer (own) / Admin (any): fetch a single event by id for editing. */
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizer', 'businessName');
  if (!event) throw new ApiError(404, 'Event not found.');
  await assertOwnership(req, event);
  return success(res, 200, 'Event fetched.', event);
});

/** Organizer/Admin: create a new event (defaults to pending_approval unless admin). */
const createEvent = asyncHandler(async (req, res) => {
  const organizerId = await resolveOrganizerId(req);

  const body = { ...req.body, organizer: organizerId };
  if (typeof body.ticketTypes === 'string') body.ticketTypes = JSON.parse(body.ticketTypes);
  if (typeof body.tags === 'string') body.tags = body.tags.split(',').map((t) => t.trim());
  if (req.file) body.posterImage = getUploadedUrl(req.file, 'events');

  body.status = req.user.role === 'admin' ? 'published' : 'pending_approval';

  const event = await Event.create(body);
  return success(res, 201, 'Event created successfully.', event);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');
  await assertOwnership(req, event);

  const body = { ...req.body };
  if (typeof body.ticketTypes === 'string') body.ticketTypes = JSON.parse(body.ticketTypes);
  if (typeof body.tags === 'string') body.tags = body.tags.split(',').map((t) => t.trim());
  if (req.file) body.posterImage = getUploadedUrl(req.file, 'events');

  Object.assign(event, body);
  await event.save();

  return success(res, 200, 'Event updated successfully.', event);
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');
  await assertOwnership(req, event);

  await event.deleteOne();
  return success(res, 200, 'Event deleted successfully.');
});

const setEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'pending_approval', 'published', 'unpublished', 'cancelled'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status.');

  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');
  await assertOwnership(req, event);

  if (status === 'published' && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can publish events. Submit for approval instead.');
  }

  event.status = status;
  await event.save();
  return success(res, 200, `Event status updated to ${status}.`, event);
});

/** Admin-only: flag/unflag an event for the flashing header promo ticker. */
const setEventPromoted = asyncHandler(async (req, res) => {
  const { isPromoted } = req.body;
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  event.isPromoted = Boolean(isPromoted);
  await event.save();

  return success(res, 200, `Event ${event.isPromoted ? 'promoted' : 'unpromoted'}.`, event);
});

/** Organizer: list events belonging to my organizer profile. */
const myEvents = asyncHandler(async (req, res) => {
  const organizerId = await resolveOrganizerId(req);
  const events = await Event.find({ organizer: organizerId }).sort({ createdAt: -1 });
  return success(res, 200, 'Your events fetched.', events);
});

/** Admin: list every event on the platform regardless of status. */
const adminListEvents = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const events = await Event.find(query)
    .populate('organizer', 'businessName isVerified')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Events fetched.', events);
});

async function resolveOrganizerId(req) {
  if (req.user.role === 'admin' && req.body.organizer) return req.body.organizer;
  if (req.user.organizer) return req.user.organizer;

  if (req.user.role === 'admin') {
    let organizer = await Organizer.findOne({ user: req.user._id });
    if (!organizer) {
      organizer = await Organizer.create({
        user: req.user._id,
        businessName: req.user.fullName || 'FEVA FEST',
        contactEmail: req.user.email,
        contactPhone: req.user.phoneNumber,
        isApproved: true,
        isVerified: true,
      });
      req.user.organizer = organizer._id;
      await req.user.save();
    }
    return organizer._id;
  }

  throw new ApiError(403, 'You must create an organizer profile before adding events.');
}

async function assertOwnership(req, event) {
  if (req.user.role === 'admin') return;
  if (String(event.organizer) !== String(req.user.organizer)) {
    throw new ApiError(403, 'You do not have permission to modify this event.');
  }
}

module.exports = {
  listEvents,
  getEventBySlug,
  getEventById,
  getEventCategories,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus,
  setEventPromoted,
  myEvents,
  adminListEvents,
};
