const express = require('express');
const {
  registerOrganizer,
  getMyOrganizerProfile,
  organizerStats,
  adminListOrganizers,
  adminApproveOrganizer,
} = require('../controllers/organizerController');
const { protect, authorize } = require('../middleware/auth');
const { uploadOrganizerLogo } = require('../middleware/upload');

const router = express.Router();

router.post('/register', protect, uploadOrganizerLogo.single('logo'), registerOrganizer);
router.get('/me', protect, authorize('organizer', 'admin'), getMyOrganizerProfile);
router.get('/me/stats', protect, authorize('organizer', 'admin'), organizerStats);

router.get('/', protect, authorize('admin'), adminListOrganizers);
router.patch('/:id/approve', protect, authorize('admin'), adminApproveOrganizer);

module.exports = router;
