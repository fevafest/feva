const express = require('express');
const {
  dashboardStats,
  listAdmins,
  createAdmin,
  setSuperAdminStatus,
} = require('../controllers/adminController');
const { protect, authorize, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), dashboardStats);

router.get('/admins', protect, requireSuperAdmin, listAdmins);
router.post('/admins', protect, requireSuperAdmin, createAdmin);
router.patch('/admins/:id/superadmin', protect, requireSuperAdmin, setSuperAdminStatus);

module.exports = router;
