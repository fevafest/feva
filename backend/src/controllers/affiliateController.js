const Affiliate = require('../models/Affiliate');
const AffiliateEventRate = require('../models/AffiliateEventRate');
const AffiliateClick = require('../models/AffiliateClick');
const Commission = require('../models/Commission');
const Order = require('../models/Order');
const User = require('../models/User');
const Event = require('../models/Event');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { generateAffiliateCode } = require('../utils/generateReference');
const { resolveAffiliateByCode } = require('../services/affiliateService');

const DEFAULT_COMMISSION_PERCENT = parseFloat(
  process.env.AFFILIATE_DEFAULT_COMMISSION_PERCENT || '10'
);

/** Registers the current user as an affiliate (pending admin approval). */
const registerAffiliate = asyncHandler(async (req, res) => {
  if (req.user.affiliate) {
    throw new ApiError(409, 'You already have an affiliate profile.');
  }

  const { displayName, type, bio, instagram, tiktok, twitter, website } = req.body;
  if (!displayName) throw new ApiError(400, 'Display name is required.');

  let code;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateAffiliateCode(displayName);
    // eslint-disable-next-line no-await-in-loop
    const clash = await Affiliate.findOne({ code: candidate });
    if (!clash) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new ApiError(500, 'Could not generate a unique affiliate code. Please try again.');

  const affiliate = await Affiliate.create({
    user: req.user._id,
    code,
    displayName,
    type: type || 'other',
    bio,
    socialLinks: { instagram, tiktok, twitter, website },
    defaultCommissionPercent: DEFAULT_COMMISSION_PERCENT,
  });

  await User.findByIdAndUpdate(req.user._id, { role: 'affiliate', affiliate: affiliate._id });

  return success(res, 201, 'Affiliate profile created. Awaiting admin approval.', affiliate);
});

const getMyAffiliateProfile = asyncHandler(async (req, res) => {
  if (!req.user.affiliate) throw new ApiError(404, 'No affiliate profile found.');
  const affiliate = await Affiliate.findById(req.user.affiliate);
  return success(res, 200, 'Affiliate profile fetched.', affiliate);
});

/** Shared by the affiliate's own dashboard and the admin performance view. */
async function computeAffiliateStats(affiliateId) {
  const [affiliate, paidOrders, commissions] = await Promise.all([
    Affiliate.findById(affiliateId),
    Order.find({ affiliate: affiliateId, paymentStatus: 'PAID' }).populate('event', 'title'),
    Commission.find({ affiliate: affiliateId }),
  ]);
  if (!affiliate) return null;

  const ticketsSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);
  const revenueGenerated = paidOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const paidOrderCount = paidOrders.length;
  const conversionRate = affiliate.totalClicks > 0 ? (paidOrderCount / affiliate.totalClicks) * 100 : 0;

  const commissionByStatus = { PENDING: 0, AVAILABLE: 0, PAID: 0 };
  for (const c of commissions) {
    commissionByStatus[c.status] = (commissionByStatus[c.status] || 0) + c.commissionAmount;
  }
  const commissionEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

  const perEventMap = new Map();
  for (const order of paidOrders) {
    const key = String(order.event._id);
    const entry = perEventMap.get(key) || {
      eventId: order.event._id,
      title: order.event.title,
      ticketsSold: 0,
      revenue: 0,
    };
    entry.ticketsSold += order.quantity;
    entry.revenue += order.subtotal;
    perEventMap.set(key, entry);
  }

  return {
    affiliate,
    totalClicks: affiliate.totalClicks,
    ticketsSold,
    revenueGenerated,
    paidOrderCount,
    conversionRate: Math.round(conversionRate * 100) / 100,
    commissionEarned,
    commissionPending: commissionByStatus.PENDING,
    commissionAvailable: commissionByStatus.AVAILABLE,
    commissionPaid: commissionByStatus.PAID,
    perEvent: [...perEventMap.values()],
  };
}

const getMyStats = asyncHandler(async (req, res) => {
  if (!req.user.affiliate) throw new ApiError(403, 'Affiliate profile required.');
  const stats = await computeAffiliateStats(req.user.affiliate);
  return success(res, 200, 'Affiliate stats fetched.', stats);
});

const getMyCommissions = asyncHandler(async (req, res) => {
  if (!req.user.affiliate) throw new ApiError(403, 'Affiliate profile required.');
  const { status } = req.query;
  const query = { affiliate: req.user.affiliate };
  if (status) query.status = status;

  const commissions = await Commission.find(query)
    .populate('event', 'title venue startDate')
    .populate('order', 'orderNumber quantity total createdAt')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Commissions fetched.', commissions);
});

/**
 * POST /api/affiliates/track-click — public, no auth. Logs a click for a
 * valid affiliate code and bumps their counter. Unknown/inactive codes are
 * silently ignored (still 200, to avoid leaking which codes are valid).
 */
const trackClick = asyncHandler(async (req, res) => {
  const { code, eventId } = req.body;
  const affiliate = await resolveAffiliateByCode(code);
  if (!affiliate) {
    return success(res, 200, 'Click acknowledged.');
  }

  let event;
  if (eventId) {
    event = await Event.findById(eventId).select('_id').catch(() => null);
  }

  await Promise.all([
    Affiliate.updateOne({ _id: affiliate._id }, { $inc: { totalClicks: 1 } }),
    AffiliateClick.create({ affiliate: affiliate._id, event: event ? event._id : undefined }),
  ]);

  return success(res, 200, 'Click recorded.');
});

/** Admin: list affiliates, optionally filtered by approval status. */
const adminListAffiliates = asyncHandler(async (req, res) => {
  const { approved } = req.query;
  const query = {};
  if (approved === 'true') query.isApproved = true;
  if (approved === 'false') query.isApproved = false;

  const affiliates = await Affiliate.find(query)
    .populate('user', 'fullName email phoneNumber')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Affiliates fetched.', affiliates);
});

const adminApproveAffiliate = asyncHandler(async (req, res) => {
  const affiliate = await Affiliate.findById(req.params.id);
  if (!affiliate) throw new ApiError(404, 'Affiliate not found.');

  affiliate.isApproved = true;
  await affiliate.save();

  return success(res, 200, 'Affiliate approved.', affiliate);
});

const adminSetAffiliateStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const affiliate = await Affiliate.findById(req.params.id);
  if (!affiliate) throw new ApiError(404, 'Affiliate not found.');

  if (typeof isActive === 'boolean') affiliate.isActive = isActive;
  await affiliate.save();

  return success(res, 200, 'Affiliate updated.', affiliate);
});

const adminSetDefaultRate = asyncHandler(async (req, res) => {
  const { defaultCommissionPercent } = req.body;
  if (typeof defaultCommissionPercent !== 'number' || defaultCommissionPercent < 0 || defaultCommissionPercent > 100) {
    throw new ApiError(400, 'defaultCommissionPercent must be a number between 0 and 100.');
  }

  const affiliate = await Affiliate.findById(req.params.id);
  if (!affiliate) throw new ApiError(404, 'Affiliate not found.');

  affiliate.defaultCommissionPercent = defaultCommissionPercent;
  await affiliate.save();

  return success(res, 200, 'Default commission rate updated.', affiliate);
});

/** Admin: list this affiliate's per-event rate overrides. */
const adminListEventRates = asyncHandler(async (req, res) => {
  const rates = await AffiliateEventRate.find({ affiliate: req.params.id }).populate(
    'event',
    'title startDate'
  );
  return success(res, 200, 'Event rates fetched.', rates);
});

/** Admin: create/update a per-event commission rate override for an affiliate. */
const adminSetEventRate = asyncHandler(async (req, res) => {
  const { eventId, commissionPercent } = req.body;
  if (!eventId || typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 100) {
    throw new ApiError(400, 'eventId and a commissionPercent between 0 and 100 are required.');
  }

  const affiliate = await Affiliate.findById(req.params.id);
  if (!affiliate) throw new ApiError(404, 'Affiliate not found.');

  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found.');

  const rate = await AffiliateEventRate.findOneAndUpdate(
    { affiliate: affiliate._id, event: eventId },
    { commissionPercent },
    { upsert: true, new: true }
  ).populate('event', 'title startDate');

  return success(res, 200, 'Event commission rate saved.', rate);
});

const adminRemoveEventRate = asyncHandler(async (req, res) => {
  await AffiliateEventRate.deleteOne({ affiliate: req.params.id, event: req.params.eventId });
  return success(res, 200, 'Event commission rate removed.');
});

/** Admin: performance view for a single affiliate (same shape as their own dashboard). */
const adminGetAffiliateStats = asyncHandler(async (req, res) => {
  const stats = await computeAffiliateStats(req.params.id);
  if (!stats) throw new ApiError(404, 'Affiliate not found.');
  return success(res, 200, 'Affiliate stats fetched.', stats);
});

/** Admin: list commissions across all affiliates, for payout management. */
const adminListCommissions = asyncHandler(async (req, res) => {
  const { affiliate, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (affiliate) query.affiliate = affiliate;
  if (status) query.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [commissions, total] = await Promise.all([
    Commission.find(query)
      .populate('affiliate', 'displayName code')
      .populate('event', 'title')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Commission.countDocuments(query),
  ]);

  return success(res, 200, 'Commissions fetched.', commissions, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/** Admin: move one commission through Pending -> Available -> Paid (or back). */
const adminUpdateCommissionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['PENDING', 'AVAILABLE', 'PAID'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status.');

  const commission = await Commission.findById(req.params.id);
  if (!commission) throw new ApiError(404, 'Commission not found.');

  commission.status = status;
  commission.paidAt = status === 'PAID' ? new Date() : undefined;
  await commission.save();

  return success(res, 200, `Commission marked ${status}.`, commission);
});

/** Admin: pay out every AVAILABLE commission for one affiliate in one action. */
const adminBulkMarkPaid = asyncHandler(async (req, res) => {
  const { affiliateId } = req.body;
  if (!affiliateId) throw new ApiError(400, 'affiliateId is required.');

  const result = await Commission.updateMany(
    { affiliate: affiliateId, status: 'AVAILABLE' },
    { status: 'PAID', paidAt: new Date() }
  );

  return success(res, 200, `${result.modifiedCount} commission(s) marked paid.`, {
    modifiedCount: result.modifiedCount,
  });
});

module.exports = {
  registerAffiliate,
  getMyAffiliateProfile,
  getMyStats,
  getMyCommissions,
  trackClick,
  adminListAffiliates,
  adminApproveAffiliate,
  adminSetAffiliateStatus,
  adminSetDefaultRate,
  adminListEventRates,
  adminSetEventRate,
  adminRemoveEventRate,
  adminGetAffiliateStats,
  adminListCommissions,
  adminUpdateCommissionStatus,
  adminBulkMarkPaid,
};
