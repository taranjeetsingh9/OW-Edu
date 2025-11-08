// models/ecoorbit-edu/Badge.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const RequirementSchema = new Schema({
  type: {
    type: String,
    enum: ['mission-completion', 'skill-mastery', 'streak', 'community'],
    required: true
  },
  threshold: { type: Number, min: 0 },        // missions completed, skill level, days, etc.
  // Optional pointers (use whichever applies to the requirement)
  specificMission: { type: Schema.Types.ObjectId },              // e.g., a particular mission ID
  specificSkill:   { type: Schema.Types.ObjectId, ref: 'Skill' },// for skill-mastery
  timeLimit: { type: Number, min: 0 }          // days (for streak/time-limited badges)
}, { _id: false });

const RewardSchema = new Schema({
  xp: { type: Number, required: true, min: 0 },
  unlocks: [String],                           // features or content unlocked
  specialEffects: [String]                     // visual effects key(s) for profile UI
}, { _id: false });

const VisualSchema = new Schema({
  icon: { type: String, required: true },      // icon key or URL
  color: { type: String, trim: true },         // e.g., "#34d399" or "emerald-500"
  animation: { type: String, trim: true }      // e.g., "pulse", "sparkle"
}, { _id: false });

const MetadataSchema = new Schema({
  timesEarned: { type: Number, default: 0, min: 0 },
  firstEarned: Date,
  lastEarned: Date
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 120
  },
  description: { type: String, trim: true, maxlength: 1000 },

  category: {
    type: String,
    enum: ['environmental', 'technical', 'collaboration', 'exploration'],
    required: true,
    index: true
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
    index: true
  },

  requirements: { type: RequirementSchema, required: true },

  reward: { type: RewardSchema, required: true },

  visual: { type: VisualSchema, required: true },

  metadata: { type: MetadataSchema, default: () => ({}) },

  status: {
    type: String,
    enum: ['active', 'retired', 'seasonal'],
    default: 'active',
    index: true
  },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'ecoorbit_badges'
});

/* ---------------------- Indexes ---------------------- */

BadgeSchema.index({ name: 1 }, { unique: true });
BadgeSchema.index({ category: 1, difficulty: 1 });
BadgeSchema.index({ status: 1, isActive: 1 });
BadgeSchema.index({ name: 'text', description: 'text' }); // quick catalog search

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('Badge', BadgeSchema);
