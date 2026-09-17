const Affiliate = require('../models/Affiliate');
const AffiliateEventRate = require('../models/AffiliateEventRate');
const Commission = require('../models/Commission');

/**
 * Looks up an approved, active affiliate by their code. Returns null for an
 * unknown/unapproved/deactivated code rather than throwing — a bad or stale
 * ref code should never block checkout, it should just fail to attribute.
 */
async function resolveAffiliateByCode(code) {
  if (!code) return null;
  const affiliate = await Affiliate.findOne({
    code: String(code).toUpperCase().trim(),
    isApproved: true,
    isActive: true,
  });
  return affiliate;
}

/** Per-event override rate if one exists, otherwise the affiliate's default. */
async function resolveCommissionPercent(affiliateId, eventId) {
  const override = await AffiliateEventRate.findOne({ affiliate: affiliateId, event: eventId });
  if (override) return override.commissionPercent;

  const affiliate = await Affiliate.findById(affiliateId).select('defaultCommissionPercent');
  return affiliate ? affiliate.defaultCommissionPercent : 0;
}

/**
 * Creates the Commission record for a confirmed order. Called ONLY from
 * paymentController.payheroCallback's success branch, after the order has
 * been marked PAID — never from anywhere the frontend can reach. Idempotent
 * via the unique index on Commission.order (a duplicate callback for an
 * already-PAID order never reaches this far anyway, since payheroCallback
 * short-circuits before this point, but the unique index is a second,
 * independent guard against ever double-crediting an affiliate).
 */
async function createCommissionForOrder(order) {
  if (!order.affiliate) return null;

  const existing = await Commission.findOne({ order: order._id });
  if (existing) return existing;

  const commissionPercent = await resolveCommissionPercent(order.affiliate, order.event);
  if (!commissionPercent || commissionPercent <= 0) return null;

  const baseAmount = order.subtotal;
  const commissionAmount = Math.round(baseAmount * (commissionPercent / 100));

  try {
    const commission = await Commission.create({
      affiliate: order.affiliate,
      order: order._id,
      event: order.event,
      baseAmount,
      commissionPercent,
      commissionAmount,
      status: 'PENDING',
    });
    return commission;
  } catch (err) {
    // Duplicate key (E11000) means another concurrent callback already
    // created it — that's fine, treat as already-handled, not an error.
    if (err.code === 11000) return Commission.findOne({ order: order._id });
    throw err;
  }
}

module.exports = { resolveAffiliateByCode, resolveCommissionPercent, createCommissionForOrder };
