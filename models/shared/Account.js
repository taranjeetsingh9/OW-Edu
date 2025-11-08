// models/shared/Account.js
const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  deviceType: { type: String, enum: ['mobile', 'tablet', 'desktop'], required: true },
  userAgent: String,
  lastActive: { type: Date, default: Date.now },
  ipAddress: String,
  isActive: { type: Boolean, default: true }
}, { _id: false }); // No subdocument _id for compact storage

const ProfileReferenceSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true, trim: true, maxlength: 20 },
  avatar: { type: String, default: 'default-avatar-1' },
  isPrimary: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['free', 'premium', 'edu-institution'],
    default: 'free'
  },
  expiresAt: Date,
  features: [{
    type: String,
    enum: [
      'unlimited-missions',
      'advanced-analytics',
      'priority-support',
      'custom-missions',
      'export-reports'
    ]
  }],
  purchasedAt: { type: Date, default: Date.now }
}, { _id: false });

const NotificationPreferencesSchema = new mongoose.Schema({
  sms: { type: Boolean, default: true },
  email: { type: Boolean, default: false },
  push: { type: Boolean, default: true },
  missionUpdates: { type: Boolean, default: true },
  educationalContent: { type: Boolean, default: true },
  promotional: { type: Boolean, default: false }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const AccountSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    validate: {
      validator: v => /^\+\d{1,3}\d{7,15}$/.test(v),
      message: 'Invalid mobile number format. Use E.164 format: +1234567890'
    }
  },
  countryCode: { type: String, required: true, default: '+1' },
  isVerified: { type: Boolean, default: false },

  verification: {
    attempts: { type: Number, default: 0, max: 5 },
    lastAttempt: Date,
    lockedUntil: Date,
    verifiedAt: Date
  },

  profiles: [ProfileReferenceSchema],

  subscription: { type: SubscriptionSchema, default: () => ({}) },

  settings: {
    language: { type: String, enum: ['en', 'fr'], default: 'en' },
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({})
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'dark' }
  },

  security: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    devices: [DeviceSchema],
    twoFactorEnabled: { type: Boolean, default: false }
  },

  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted', 'pending-verification'],
    default: 'pending-verification'
  },

  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */

AccountSchema.index({ mobileNumber: 1 }, { unique: true });
AccountSchema.index({ status: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ 'subscription.type': 1 });

/* ---------------------- Static Methods ---------------------- */

// Find account by mobile number
AccountSchema.statics.findByMobileNumber = function (mobileNumber) {
  return this.findOne({ mobileNumber, isActive: true });
};

// Find all active accounts
AccountSchema.statics.findActiveAccounts = function () {
  return this.find({ status: 'active', isActive: true });
};

// Find accounts pending verification
AccountSchema.statics.findPendingVerification = function () {
  return this.find({ status: 'pending-verification', isActive: true });
};

/* ---------------------- Export ---------------------- */

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;
