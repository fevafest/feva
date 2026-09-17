const express = require('express');
const {
  updateProfile,
  changePassword,
  dashboardOverview,
  adminListUsers,
  adminUpdateUserStatus,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();

router.put('/profile', protect, uploadAvatar.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/dashboard', protect, dashboardOverview);

router.get('/', protect, authorize('admin'), adminListUsers);
router.patch('/:id/status', protect, authorize('admin'), adminUpdateUserStatus);

module.exports = router;
