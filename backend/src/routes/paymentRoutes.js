const express = require('express');
const {
  initiatePayment,
  payheroCallback,
  getPaymentStatus,
  adminListPayments,
  adminDeletePayment,
} = require('../controllers/paymentController');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/initiate', protect, paymentLimiter, initiatePayment);
router.post('/payhero/callback', payheroCallback); // public webhook, no auth
router.get('/status/:reference', protect, getPaymentStatus);
router.get('/admin', protect, requireSuperAdmin, adminListPayments);
router.delete('/admin/:id', protect, requireSuperAdmin, adminDeletePayment);

module.exports = router;
