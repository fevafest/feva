const User = require('../models/User');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');

const isRequesterSuperAdmin = (req) => req.user.role === 'admin' && req.user.isSuperAdmin;

/**
 * Regular admins must never learn that superadmins exist, so the
 * isSuperAdmin flag is stripped from any user list/record a non-superadmin
 * admin can see. Superadmins get the field untouched.
 */
function hideSuperAdminFlag(userDoc, req) {
  const obj = userDoc.toSafeObject ? userDoc.toSafeObject() : userDoc;
  if (!isRequesterSuperAdmin(req)) {
    delete obj.isSuperAdmin;
  }
  return obj;
}

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber } = req.body;
  const user = await User.findById(req.user._id);

  if (fullName) user.fullName = fullName;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

  await user.save();
  return success(res, 200, 'Profile updated.', user.toSafeObject());
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required.');
  }
  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters.');

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();
  return success(res, 200, 'Password changed successfully.');
});

/** Dashboard overview: upcoming tickets, totals, recent orders. */
const dashboardOverview = asyncHandler(async (req, res) => {
  const now = new Date();

  const [totalTickets, recentOrders, upcomingTickets] = await Promise.all([
    Ticket.countDocuments({ user: req.user._id, status: { $ne: 'CANCELLED' } }),
    Order.find({ user: req.user._id })
      .populate('event', 'title venue startDate')
      .sort({ createdAt: -1 })
      .limit(5),
    Ticket.find({ user: req.user._id, status: 'VALID' })
      .populate({ path: 'event', select: 'title venue location startDate startTime posterImage', match: { startDate: { $gte: now } } })
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  const filteredUpcoming = upcomingTickets.filter((t) => t.event);

  return success(res, 200, 'Dashboard overview fetched.', {
    totalTicketsPurchased: totalTickets,
    upcomingTickets: filteredUpcoming,
    recentOrders,
  });
});

/** Admin: list all users with basic filters. */
const adminListUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  return success(
    res,
    200,
    'Users fetched.',
    users.map((u) => hideSuperAdminFlag(u, req)),
    {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    }
  );
});

/**
 * Admin: activate/deactivate any account, or (superadmin only) change a
 * user's role. Regular admins may only toggle isActive here — creating or
 * promoting admins must go through the dedicated superadmin-only Admins page,
 * so a regular admin can never grant themselves or anyone else admin access.
 */
const adminUpdateUserStatus = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (role && role !== user.role) {
    if (!isRequesterSuperAdmin(req)) {
      throw new ApiError(403, 'Only superadmins can change a user\'s role.');
    }
    if (role === 'admin' || user.role === 'admin') {
      throw new ApiError(400, 'Manage admin accounts from Admin → Admins instead.');
    }
    user.role = role;
  }

  if (typeof isActive === 'boolean') user.isActive = isActive;
  await user.save();

  return success(res, 200, 'User updated.', hideSuperAdminFlag(user, req));
});

module.exports = {
  updateProfile,
  changePassword,
  dashboardOverview,
  adminListUsers,
  adminUpdateUserStatus,
};
