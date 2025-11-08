// models/analytics/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },

  type: {
    type: String,
    enum: [
      'system', 'mission-update', 'achievement', 
      'class-announcement', 'parent-alert', 'content-recommendation'
    ],
    required: true
  },

  title: { type: String, required: true },
  message: { type: String, required: true },

  metadata: {
    missionId: { type: Schema.Types.ObjectId },
    classId: { type: Schema.Types.ObjectId },
    relatedUrl: String
  },

  read: { type: Boolean, default: false, index: true },
  delivered: { type: Boolean, default: false }
}, { timestamps: true, collection: 'analytics_notifications' });

// indexes
NotificationSchema.index({ profileId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

// static queries
NotificationSchema.statics.unreadForUser = function(profileId) {
  return this.find({ profileId, read: false }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Notification', NotificationSchema);
