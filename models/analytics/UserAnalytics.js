// models/analytics/UserAnalytics.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  feature: {
    type: String,
    enum: ['greenlaunch', 'planetmode', 'orbitwatch', 'dashboard', 'classroom'],
    required: true
  },
  duration: Number,          // minutes
  startedAt: Date,
  endedAt: Date
}, { _id: false });

const EventSchema = new Schema({
  type: String,              // "mission-complete", "badge-earned"
  details: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserAnalyticsSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },

  totals: {
    missionsCompleted: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },   // minutes
    badgesEarned: { type: Number, default: 0 }
  },

  learning: {
    avgScore: Number,
    improvementRate: Number,
    streakDays: Number
  },

  sessions: [SessionSchema],
  events: [EventSchema],

  preferredFeature: {
    type: String,
    enum: ['greenlaunch', 'planetmode', 'orbitwatch', 'none'],
    default: 'none'
  },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'analytics_user'
});

// indexes
UserAnalyticsSchema.index({ profileId: 1, updatedAt: -1 });
UserAnalyticsSchema.index({ 'totals.missionsCompleted': -1 });
UserAnalyticsSchema.index({ preferredFeature: 1 });

module.exports = mongoose.model('UserAnalytics', UserAnalyticsSchema);
