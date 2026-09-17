const User = require('../models/User');
const Event = require('../models/Event');
const Order = require('../models/Order');

const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { normalizeKenyanPhone } = require('../utils/phone');

const dashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalEvents, publishedEvents, paidOrders, pendingOrders, recentOrders] =
    await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      Order.find({ paymentStatus: 'PAID' }),
      Order.countDocuments({ paymentStatus: { $in: ['PENDING', 'PAYMENT_PENDING'] } }),
      Order.find()
        .populate('user', 'fullName email')
        .populate('event', 'title')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const ticketsSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);

  // Revenue trend for the last 7 days, used for a simple line/bar chart.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentPaid = paidOrders.filter((o) => o.paidAt && o.paidAt >= sevenDaysAgo);
  const revenueByDay = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const dayKey = day.toISOString().slice(0, 10);
    const dayTotal = recentPaid
      .filter((o) => o.paidAt.toISOString().slice(0, 10) === dayKey)
      .reduce((sum, o) => sum + o.total, 0);
    return { date: dayKey, revenue: dayTotal };
  });

  return success(res, 200, 'Dashboard stats fetched.', {
    totalUsers,
    totalEvents,
    publishedEvents,
    ticketsSold,
    totalRevenue,
    pendingOrders,
    recentOrders,
    revenueByDay,
  });
});

/** Superadmin: list every admin account (regular admins and superadmins). */
const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
  return success(res, 200, 'Admins fetched.', admins);
});

/** Superadmin: create a new admin account. Optionally grants superadmin too. */
const createAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password, isSuperAdmin } = req.body;

  if (!fullName || !email || !phoneNumber || !password) {
    throw new ApiError(400, 'Full name, email, phone number and password are required.');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters.');
  }

  const normalizedPhone = normalizeKenyanPhone(phoneNumber);
  if (!normalizedPhone) {
    throw new ApiError(400, 'Enter a valid Kenyan phone number, e.g. 0712345678.');
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phoneNumber: normalizedPhone }],
  });
  if (existing) {
    throw new ApiError(409, 'An account with this email or phone number already exists.');
  }

  const admin = await User.create({
    fullName,
    email,
    phoneNumber,
    password,
    role: 'admin',
    isSuperAdmin: Boolean(isSuperAdmin),
  });

  return success(res, 201, 'Admin account created.', admin.toSafeObject());
});

/** Superadmin: revoke or grant superadmin status on an existing admin. */
const setSuperAdminStatus = asyncHandler(async (req, res) => {
  const { isSuperAdmin } = req.body;
  const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
  if (!admin) throw new ApiError(404, 'Admin account not found.');

  if (String(admin._id) === String(req.user._id) && isSuperAdmin === false) {
    throw new ApiError(400, 'You cannot remove your own superadmin access.');
  }

  admin.isSuperAdmin = Boolean(isSuperAdmin);
  await admin.save();

  return success(res, 200, 'Admin updated.', admin.toSafeObject());
});

module.exports = { dashboardStats, listAdmins, createAdmin, setSuperAdminStatus };
