// models/analytics/Content.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContentSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['article', 'video', 'mission-guide', 'science-brief', 'news'],
    required: true
  },
  tags: [{ type: String, trim: true }],
  author: {
    name: String,
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile' }
  },

  url: String,               // external resources
  media: {
    thumbnail: String,
    duration: Number         // seconds (for video)
  },

  // engagement
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },

  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true, collection: 'analytics_content' });

// indexes
ContentSchema.index({ title: 'text', tags: 1 });
ContentSchema.index({ type: 1 });
ContentSchema.index({ isFeatured: 1, createdAt: -1 });

// static queries
ContentSchema.statics.featured = function() {
  return this.find({ isActive: true, isFeatured: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Content', ContentSchema);
