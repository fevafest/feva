const express = require('express');
const { getPublicSettings, adminGetSettings, adminUpdateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPublicSettings);
router.get('/admin', protect, authorize('admin'), adminGetSettings);
router.patch('/admin', protect, authorize('admin'), adminUpdateSettings);

module.exports = router;
