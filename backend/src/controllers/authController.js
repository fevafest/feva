const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { normalizeKenyanPhone, looksLikeEmail } = require('../utils/phone');

const register = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;

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
    throw new ApiError(
      409,
      existing.email === email.toLowerCase()
        ? 'An account with this email already exists.'
        : 'An account with this phone number already exists.'
    );
  }

  const user = await User.create({ fullName, email, phoneNumber, password });
  const token = generateToken(user);

  return success(res, 201, 'Account created successfully.', {
    token,
    user: user.toSafeObject(),
  });
});

/**
 * Logs a user in with either their email address or their phone number as
 * the identifier, so returning customers can use whichever they remember.
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new ApiError(400, 'Email/phone number and password are required.');
  }

  let user;
  if (looksLikeEmail(identifier)) {
    user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
  } else {
    const normalizedPhone = normalizeKenyanPhone(identifier);
    if (normalizedPhone) {
      user = await User.findOne({ phoneNumber: normalizedPhone }).select('+password');
    }
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated. Contact support.');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);
  return success(res, 200, 'Logged in successfully.', {
    token,
    user: user.toSafeObject(),
  });
});

const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, 'Current user fetched.', { user: req.user.toSafeObject() });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way whether or not the user exists, to avoid
  // leaking which emails are registered.
  if (!user) {
    return success(
      res,
      200,
      'If an account exists for this email, a reset link has been sent.'
    );
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // In production this would be emailed/SMSed. For now we return it so the
  // reset flow is fully testable end-to-end without an email provider.
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:4200').replace(/\/$/, '');
  const resetUrl = `${clientUrl}/auth/reset-password/${resetToken}`;

  return success(res, 200, 'If an account exists for this email, a reset link has been sent.', {
    ...(process.env.NODE_ENV !== 'production' ? { resetToken, resetUrl } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, 'Token and new password are required.');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Password reset link is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const authToken = generateToken(user);
  return success(res, 200, 'Password has been reset successfully.', {
    token: authToken,
    user: user.toSafeObject(),
  });
});

module.exports = { register, login, getMe, forgotPassword, resetPassword };
