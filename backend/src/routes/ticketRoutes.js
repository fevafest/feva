const express = require('express');
const {
  myTickets,
  getTicketById,
  verifyTicket,
  markTicketUsed,
  adminListTickets,
  adminDeleteTicket,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', protect, myTickets);
router.get('/admin', protect, authorize('admin'), adminListTickets);
router.get('/:ticketId', protect, getTicketById);
router.post('/verify', protect, authorize('admin', 'staff', 'organizer'), verifyTicket);
router.patch('/:ticketId/use', protect, authorize('admin', 'staff', 'organizer'), markTicketUsed);
router.delete('/:ticketId', protect, authorize('admin'), adminDeleteTicket);

module.exports = router;
