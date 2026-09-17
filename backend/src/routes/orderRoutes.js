const express = require('express');
const {
  createOrder,
  getOrderByReference,
  myOrders,
  adminListOrders,
  organizerOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, myOrders);
router.get('/organizer', protect, authorize('organizer', 'admin'), organizerOrders);
router.get('/admin', protect, authorize('admin'), adminListOrders);
router.get('/:reference', protect, getOrderByReference);

module.exports = router;
