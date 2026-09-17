const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account not found or deactivated.');
  }

  req.user = user;
  next();
});

/** Attaches req.user if a valid token is present, but does not require one. */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
});

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'You are not authorized to perform this action.');
    }
    next();
  };
}

/** Restricts a route to admins who are also flagged as superadmin. */
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin' || !req.user.isSuperAdmin) {
    throw new ApiError(403, 'This action is restricted to superadmins.');
  }
  next();
}

module.exports = { protect, optionalAuth, authorize, requireSuperAdmin };
