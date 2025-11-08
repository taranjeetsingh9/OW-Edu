// models/shared/AuthSession.js
const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

// OTP (One-Time Password) schema
const OTPSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'OTP code is required'],
    minlength: [4, 'OTP code must be at least 4 digits'],
    maxlength: [6, 'OTP code cannot exceed 6 digits'],
    validate: {
      validator: v => /^\d+$/.test(v),
      message: 'OTP code must contain only numbers'
    }
  },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, max: [5, 'Maximum OTP attempts exceeded'] },
  generatedAt: { type: Date, default: Date.now },
  purpose: {
    type: String,
    enum: ['login', 'verification', 'password-reset', 'profile-setup'],
    default: 'login'
  }
}, { _id: false }); // prevent _id for subdocs

// Device Info schema
const DeviceInfoSchema = new mongoose.Schema({
  userAgent: { type: String, required: true },
  ipAddress: { type: String, required: true },
  deviceId: { type: String, required: true },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
  browser: String,
  operatingSystem: String
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const AuthSessionSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    index: true,
    validate: {
      validator: v => /^\+\d{1,3}\d{7,15}$/.test(v),
      message: 'Invalid mobile number format (use E.164: +1234567890)'
    }
  },

  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    index: true
  },

  otp: { type: OTPSchema, required: true },

  sessionToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  refreshToken: {
    type: String,
    unique: true,
    sparse: true
  },

  deviceInfo: { type: DeviceInfoSchema, required: true },

  status: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'failed', 'revoked'],
    default: 'pending',
    index: true
  },

  security: {
    failedAttempts: { type: Number, default: 0 },
    lastAttempt: Date,
    lockedUntil: Date,
    verifiedAt: Date
  },

  sessionData: {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }
  },

  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */

// TTL index for OTP expiry — deletes document automatically after 10 minutes
AuthSessionSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 600 });

// Common lookup patterns
AuthSessionSchema.index({ mobileNumber: 1, createdAt: -1 });
AuthSessionSchema.index({ sessionToken: 1 }, { unique: true, sparse: true });
AuthSessionSchema.index({ status: 1 });
AuthSessionSchema.index({ isActive: 1 });

/* ---------------------- Static Methods ---------------------- */

// Find sessions by mobile number
AuthSessionSchema.statics.findByMobileNumber = function (mobileNumber) {
  return this.find({ mobileNumber, isActive: true }).sort({ createdAt: -1 });
};

// Find verified session by session token
AuthSessionSchema.statics.findByToken = function (sessionToken) {
  return this.findOne({
    sessionToken,
    status: 'verified',
    isActive: true
  });
};

// Find all pending OTP sessions that haven’t expired
AuthSessionSchema.statics.findPendingSessions = function () {
  return this.find({
    status: 'pending',
    isActive: true,
    'otp.expiresAt': { $gt: new Date() }
  });
};

/* ---------------------- Export ---------------------- */

const AuthSession = mongoose.model('AuthSession', AuthSessionSchema);
module.exports = AuthSession;
