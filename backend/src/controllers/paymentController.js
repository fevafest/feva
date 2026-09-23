const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const payheroService = require('../services/payheroService');
const { generateTicketsForOrder } = require('../services/ticketService');
const emailService = require('../services/emailService');
const { createCommissionForOrder } = require('../services/affiliateService');

/**
 * POST /api/payments/initiate
 * Kicks off the M-Pesa STK push for a PENDING order. Marks the order as
 * PAYMENT_PENDING immediately, but never marks it PAID here — that only
 * happens once PayHero's callback confirms the transaction.
 */
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderReference } = req.body;
  if (!orderReference) throw new ApiError(400, 'Order reference is required.');

  const order = await Order.findOne({ paymentReference: orderReference });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You do not have access to this order.');
  }
  if (order.paymentStatus === 'PAID') {
    throw new ApiError(409, 'This order has already been paid for.');
  }
  if (order.paymentStatus === 'PAYMENT_PENDING') {
    throw new ApiError(409, 'A payment request is already pending for this order.');
  }

  // The STK push is fired in parallel with writing the Payment row so the
  // prompt reaches the customer's phone a round trip sooner. The row still
  // lands well before any callback could reference it.
  const pushPromise = payheroService
    .initiateStkPush({
      amount: order.total,
      phoneNumber: order.phoneNumber,
      reference: order.paymentReference,
      customerName: req.user.fullName,
    })
    .catch((err) => ({ __error: err }));

  const payment = await Payment.create({
    order: order._id,
    reference: order.paymentReference,
    amount: order.total,
    phoneNumber: order.phoneNumber,
    status: 'PENDING',
  });

  try {
    const payheroResponse = await pushPromise;
    if (payheroResponse?.__error) throw payheroResponse.__error;

    payment.rawInitiateResponse = payheroResponse;
    payment.payheroCheckoutRequestId = payheroResponse?.CheckoutRequestID || undefined;
    await payment.save();

    order.paymentStatus = 'PAYMENT_PENDING';
    await order.save();

    return success(res, 200, 'STK push sent. Check your phone and enter your M-Pesa PIN.', {
      orderReference: order.paymentReference,
      status: order.paymentStatus,
    });
  } catch (err) {
    // PayHero returns a JSON error body (e.g. abuse-protection blocks) — log
    // the real reason server-side while keeping the client message generic.
    const payheroMessage = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('[payheroService] STK push failed:', payheroMessage, err.response?.data ?? '');

    payment.status = 'FAILED';
    payment.resultDescription = payheroMessage;
    payment.rawInitiateResponse = err.response?.data;
    await payment.save();

    order.paymentStatus = 'FAILED';
    order.orderStatus = 'FAILED';
    order.failureReason = payheroMessage;
    await order.save();

    if (err.code === 'PAYHERO_NOT_CONFIGURED') {
      throw new ApiError(503, err.message);
    }
    throw new ApiError(502, 'Failed to initiate M-Pesa payment. Please try again.');
  }
});

/**
 * POST /api/payments/payhero/callback
 * PayHero posts the final transaction result here asynchronously. This is
 * the ONLY place an order may transition to PAID. Duplicate callbacks for
 * an already-processed order are acknowledged but ignored.
 */
const payheroCallback = asyncHandler(async (req, res) => {
  // PayHero posts { forward_url, response: {...}, status: true }. Everything
  // we care about (ExternalReference, ResultCode, etc.) lives in `response`.
  const body = req.body?.response || req.body;

  const reference = body?.ExternalReference || body?.MerchantRequestID;
  const resultCode = body?.ResultCode;
  const isSuccess = resultCode === 0 || String(body?.Status || '').toUpperCase() === 'SUCCESS';

  if (!reference) {
    // Always 200 so PayHero does not endlessly retry a malformed payload,
    // but log it for investigation.
    console.error('PayHero callback missing reference:', JSON.stringify(body));
    return res.status(200).json({ received: true });
  }

  const order = await Order.findOne({ paymentReference: reference });
  const payment = await Payment.findOne({ reference });

  if (!order || !payment) {
    console.error('PayHero callback for unknown order/payment:', reference);
    return res.status(200).json({ received: true });
  }

  // Idempotency guard: ignore duplicate callbacks once already resolved. A
  // late SUCCESS is still honoured even if the payment was previously timed
  // out as stale, otherwise real money collected by M-Pesa would be dropped.
  const alreadyFailed = order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED';
  if (order.paymentStatus === 'PAID' || (alreadyFailed && !isSuccess)) {
    return res.status(200).json({ received: true, alreadyProcessed: true });
  }

  payment.rawCallbackResponse = body;
  payment.payheroTransactionId = body?.MpesaReceiptNumber || undefined;
  payment.resultDescription = body?.ResultDesc;
  payment.processedAt = new Date();

  if (isSuccess && typeof body?.Amount === 'number' && Math.round(body.Amount) !== order.total) {
    // Not blocking — PayHero already collected the money — but worth a loud
    // log so reconciliation catches any partial/mismatched payment quickly.
    console.warn(
      `[payheroCallback] Amount mismatch for order ${order.orderNumber}: expected ${order.total}, PayHero reports ${body.Amount}.`
    );
  }

  if (isSuccess) {
    payment.status = 'SUCCESS';
    await payment.save();

    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.paidAt = new Date();
    await order.save();

    // Reserve stock and generate tickets — idempotent against duplicate callbacks.
    await reserveTicketStock(order);
    const tickets = await generateTicketsForOrder(order);
    order.tickets = tickets.map((t) => t._id);
    await order.save();

    // Commission is only ever created here, after payment is confirmed —
    // never at order/checkout time. No-ops if the order has no affiliate.
    await createCommissionForOrder(order).catch((err) =>
      console.error('[payheroCallback] Commission creation failed:', err.message)
    );

    // Best-effort: email the customer their QR tickets. Never blocks or
    // fails the payment confirmation if email isn't configured/reachable.
    emailTicketsToCustomer(order, tickets).catch((err) =>
      console.error('[payheroCallback] Ticket email dispatch failed:', err.message)
    );
  } else {
    payment.status = 'FAILED';
    await payment.save();

    order.paymentStatus = 'FAILED';
    order.orderStatus = 'FAILED';
    order.failureReason = payment.resultDescription || 'Payment was not completed.';
    await order.save();
  }

  return res.status(200).json({ received: true });
});

async function reserveTicketStock(order) {
  const event = await Event.findById(order.event);
  if (!event) return;
  for (const item of order.items) {
    const ticketType = event.ticketTypes.id(item.ticketTypeId);
    if (ticketType) {
      ticketType.quantitySold = Math.min(
        ticketType.quantitySold + item.quantity,
        ticketType.quantityTotal
      );
    }
  }
  await event.save();
}

async function emailTicketsToCustomer(order, tickets) {
  const [user, event] = await Promise.all([
    User.findById(order.user).select('fullName email'),
    Event.findById(order.event).select('title venue location startDate startTime'),
  ]);
  if (!user || !event) return;

  await emailService.sendTicketEmail({
    to: user.email,
    fullName: user.fullName,
    orderNumber: order.orderNumber,
    event: {
      title: event.title,
      venue: event.venue,
      location: event.location,
      startDate: event.startDate.toLocaleDateString('en-KE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      startTime: event.startTime,
    },
    tickets,
  });
}

/** GET /api/payments/status/:reference — used by the frontend to poll for confirmation. */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ paymentReference: req.params.reference });
  if (!order) throw new ApiError(404, 'Order not found.');
  // Only the buyer or a superadmin may read payment state — a regular admin
  // has no access to payment information anywhere in the app.
  if (String(order.user) !== String(req.user._id) && !req.user.isSuperAdmin) {
    throw new ApiError(403, 'You do not have access to this order.');
  }

  return success(res, 200, 'Payment status fetched.', {
    orderReference: order.paymentReference,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    total: order.total,
    failureReason: order.failureReason,
  });
});

// An M-Pesa STK prompt expires within a couple of minutes, so anything still
// PENDING well past that means no callback ever arrived (ignored prompt, or a
// callback PayHero couldn't deliver). Resolve those to FAILED so the dashboard
// never shows a dead transaction as still in flight.
const PENDING_PAYMENT_TIMEOUT_MINUTES = 10;
const TIMEOUT_REASON = 'No response from M-Pesa — the payment request timed out.';

async function expireStalePendingPayments() {
  const cutoff = new Date(Date.now() - PENDING_PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
  const stale = await Payment.find({ status: 'PENDING', createdAt: { $lt: cutoff } }).select('_id order');
  if (!stale.length) return;

  await Payment.updateMany(
    { _id: { $in: stale.map((p) => p._id) } },
    { status: 'FAILED', resultDescription: TIMEOUT_REASON, processedAt: new Date() }
  );
  await Order.updateMany(
    { _id: { $in: stale.map((p) => p.order) }, paymentStatus: { $in: ['PENDING', 'PAYMENT_PENDING'] } },
    { paymentStatus: 'FAILED', orderStatus: 'FAILED', failureReason: TIMEOUT_REASON }
  );
}

/** Admin: list payment/transaction records for reconciliation. */
const adminListPayments = asyncHandler(async (req, res) => {
  await expireStalePendingPayments();

  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate({
        path: 'order',
        select: 'orderNumber user event total',
        populate: [
          { path: 'user', select: 'fullName email phoneNumber' },
          { path: 'event', select: 'title' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payment.countDocuments(query),
  ]);

  return success(res, 200, 'Payments fetched.', payments, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/**
 * Superadmin: remove a dead payment record. A SUCCESS record is never
 * deletable — that row is the only trail of money actually collected.
 */
const adminDeletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment record not found.');

  if (payment.status === 'SUCCESS') {
    throw new ApiError(
      409,
      'A successful payment cannot be deleted. Its record is the only proof of money collected.'
    );
  }

  await payment.deleteOne();
  return success(res, 200, 'Payment record deleted.', { _id: req.params.id });
});

module.exports = {
  initiatePayment,
  payheroCallback,
  getPaymentStatus,
  adminListPayments,
  adminDeletePayment,
};
