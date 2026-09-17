const Event = require('../models/Event');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { generateOrderNumber, generatePaymentReference } = require('../utils/generateReference');
const { resolveAffiliateByCode } = require('../services/affiliateService');

const FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.05');
const FEE_FIXED = parseFloat(process.env.PLATFORM_FEE_FIXED || '0');

function computeTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const fees = Math.round(subtotal * FEE_PERCENT + FEE_FIXED);
  const total = subtotal + fees;
  return { subtotal, fees, total };
}

/**
 * Creates a PENDING order for the requested tickets. Does not touch
 * payment/ticket generation — that only happens once PayHero confirms
 * payment via the callback (see paymentController).
 */
const createOrder = asyncHandler(async (req, res) => {
  const { eventId, items, phoneNumber, affiliateCode } = req.body;

  if (!eventId || !Array.isArray(items) || items.length === 0 || !phoneNumber) {
    throw new ApiError(400, 'Event, ticket selection and phone number are required.');
  }

  const event = await Event.findById(eventId);
  if (!event || event.status !== 'published') {
    throw new ApiError(404, 'Event not available for purchase.');
  }

  // An unknown/expired/invalid ref code just means no attribution — it must
  // never block the purchase itself. Self-referrals (an affiliate buying
  // with their own code) are silently ignored too.
  let affiliate = await resolveAffiliateByCode(affiliateCode);
  if (affiliate && String(affiliate.user) === String(req.user._id)) {
    affiliate = null;
  }

  const orderItems = [];
  for (const requested of items) {
    const ticketType = event.ticketTypes.id(requested.ticketTypeId);
    if (!ticketType) throw new ApiError(400, 'Selected ticket type does not exist.');

    const quantity = parseInt(requested.quantity, 10);
    if (!quantity || quantity < 1) throw new ApiError(400, 'Quantity must be at least 1.');

    const remaining = ticketType.quantityTotal - ticketType.quantitySold;
    if (quantity > remaining) {
      throw new ApiError(400, `Only ${remaining} "${ticketType.name}" tickets remaining.`);
    }

    orderItems.push({
      ticketTypeId: ticketType._id,
      ticketTypeName: ticketType.name,
      unitPrice: ticketType.price,
      quantity,
      lineTotal: ticketType.price * quantity,
    });
  }

  const totalQuantity = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const { subtotal, fees, total } = computeTotals(orderItems);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user._id,
    event: event._id,
    affiliate: affiliate ? affiliate._id : undefined,
    affiliateCode: affiliate ? affiliate.code : undefined,
    items: orderItems,
    quantity: totalQuantity,
    subtotal,
    fees,
    total,
    phoneNumber,
    paymentReference: generatePaymentReference(),
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
  });

  return success(res, 201, 'Order created. Proceed to payment.', order);
});

const getOrderByReference = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ paymentReference: req.params.reference })
    .populate('event', 'title slug posterImage venue location startDate startTime')
    .populate('tickets');

  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order.');
  }

  return success(res, 200, 'Order fetched.', order);
});

const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('event', 'title slug posterImage venue location startDate startTime')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Orders fetched.', orders);
});

/** Admin: list and filter all orders across the platform. */
const adminListOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.paymentStatus = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'fullName email phoneNumber')
      .populate('event', 'title venue')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  return success(res, 200, 'Orders fetched.', orders, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/** Organizer: list orders for events they own. */
const organizerOrders = asyncHandler(async (req, res) => {
  if (!req.user.organizer) throw new ApiError(403, 'Organizer profile required.');

  const eventIds = await Event.find({ organizer: req.user.organizer }).distinct('_id');
  const orders = await Order.find({ event: { $in: eventIds } })
    .populate('user', 'fullName email phoneNumber')
    .populate('event', 'title venue')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Orders fetched.', orders);
});

module.exports = {
  createOrder,
  getOrderByReference,
  myOrders,
  adminListOrders,
  organizerOrders,
  computeTotals,
};
