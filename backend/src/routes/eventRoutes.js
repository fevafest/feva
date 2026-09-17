const express = require('express');
const {
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
} = require('../controllers/eventController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { uploadEventPoster } = require('../middleware/upload');

const router = express.Router();

router.get('/', listEvents);
router.get('/categories', getEventCategories);
router.get('/mine', protect, authorize('organizer', 'admin'), myEvents);
router.get('/admin/all', protect, authorize('admin'), adminListEvents);
router.get('/id/:id', protect, authorize('organizer', 'admin'), getEventById);
router.get('/:slug', optionalAuth, getEventBySlug);

router.post(
  '/',
  protect,
  authorize('organizer', 'admin'),
  uploadEventPoster.single('poster'),
  createEvent
);
router.put(
  '/:id',
  protect,
  authorize('organizer', 'admin'),
  uploadEventPoster.single('poster'),
  updateEvent
);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), setEventStatus);
router.patch('/:id/promote', protect, authorize('admin'), setEventPromoted);

module.exports = router;
