const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizeKenyanPhone } = require('../utils/phone');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: (value) => normalizeKenyanPhone(value) ?? value,
      validate: {
        validator: (value) => /^254[71]\d{8}$/.test(value),
        message: 'Enter a valid Kenyan phone number, e.g. 0712345678.',
      },
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['customer', 'organizer', 'admin', 'staff', 'affiliate'],
      default: 'customer',
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' },
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },
    // A superadmin is still role 'admin' but additionally gets to manage other
    // admin accounts and is the only one who can view the Payments section.
    isSuperAdmin: { type: Boolean, default: false },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
