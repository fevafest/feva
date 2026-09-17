const express = require('express');
const {
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
} = require('../controllers/affiliateController');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Self-service (affiliate's own dashboard)
router.post('/register', protect, registerAffiliate);
router.get('/me', protect, authorize('affiliate', 'admin'), getMyAffiliateProfile);
router.get('/me/stats', protect, authorize('affiliate', 'admin'), getMyStats);
router.get('/me/commissions', protect, authorize('affiliate', 'admin'), getMyCommissions);

// Public click tracking — no auth, since it fires from anonymous site visitors.
router.post('/track-click', apiLimiter, trackClick);

// Admin: payout/commission management (checked first so ':id' below doesn't swallow these)
router.get('/commissions', protect, authorize('admin'), adminListCommissions);
router.patch('/commissions/:id/status', protect, authorize('admin'), adminUpdateCommissionStatus);
router.post('/commissions/mark-paid', protect, authorize('admin'), adminBulkMarkPaid);

// Admin: affiliate management
router.get('/', protect, authorize('admin'), adminListAffiliates);
router.get('/:id/stats', protect, authorize('admin'), adminGetAffiliateStats);
router.patch('/:id/approve', protect, authorize('admin'), adminApproveAffiliate);
router.patch('/:id/status', protect, authorize('admin'), adminSetAffiliateStatus);
router.patch('/:id/rate', protect, authorize('admin'), adminSetDefaultRate);
router.get('/:id/event-rates', protect, authorize('admin'), adminListEventRates);
router.put('/:id/event-rates', protect, authorize('admin'), adminSetEventRate);
router.delete('/:id/event-rates/:eventId', protect, authorize('admin'), adminRemoveEventRate);

module.exports = router;
