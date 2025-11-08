// models/ecoorbit-edu/LearningProgress.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const SkillStatSchema = new Schema({
  level: { type: Number, min: 0, max: 100, default: 0 },
  xp: { type: Number, min: 0, default: 0 },
  lastPracticed: Date
}, { _id: false });

const SkillsSchema = new Schema({
  orbitalMechanics: { type: SkillStatSchema, default: () => ({}) },
  environmentalScience: { type: SkillStatSchema, default: () => ({}) },
  rocketDesign: { type: SkillStatSchema, default: () => ({}) },
  missionPlanning: { type: SkillStatSchema, default: () => ({}) },
  sustainability: { type: SkillStatSchema, default: () => ({}) }
}, { _id: false });

const CompletedMissionSchema = new Schema({
  // Polymorphic link to the submitted mission
  missionModel: { type: String, enum: ['GreenLaunchMission', 'LandingMission', 'OrbitData'] },
  missionId: { type: Schema.Types.ObjectId, refPath: 'missions.completed.missionModel' },

  feature: { type: String, enum: ['greenlaunch', 'planetmode', 'orbitwatch', 'other'], required: true },
  completedAt: { type: Date, default: Date.now },
  score: { type: Number, min: 0, max: 100 },
  timeSpent: { type: Number, min: 0 } // minutes
}, { _id: false });

const InProgressMissionSchema = new Schema({
  missionModel: { type: String, enum: ['GreenLaunchMission', 'LandingMission', 'OrbitData'] },
  missionId: { type: Schema.Types.ObjectId, refPath: 'missions.inProgress.missionModel' },

  feature: { type: String, enum: ['greenlaunch', 'planetmode', 'orbitwatch', 'other'], required: true },
  startedAt: { type: Date, default: Date.now },
  progress: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

const MissionsSchema = new Schema({
  completed: [CompletedMissionSchema],
  inProgress: [InProgressMissionSchema]
}, { _id: false });

const StreaksSchema = new Schema({
  current: { type: Number, min: 0, default: 0 }, // days
  longest: { type: Number, min: 0, default: 0 },
  lastActivity: Date
}, { _id: false });

const LeaderboardSchema = new Schema({
  classRank: { type: Number, min: 0 },
  schoolRank: { type: Number, min: 0 },
  globalRank: { type: Number, min: 0 }
}, { _id: false });

const AchievementsSchema = new Schema({
  badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
  leaderboard: { type: LeaderboardSchema, default: () => ({}) }
}, { _id: false });

const AnalyticsSchema = new Schema({
  totalTime: { type: Number, min: 0, default: 0 }, // minutes
  averageScore: { type: Number, min: 0, max: 100 },
  improvementRate: { type: Number, min: -100, max: 100 }, // % per week
  preferredFeature: { type: String, enum: ['greenlaunch', 'planetmode', 'orbitwatch', 'unknown'], default: 'unknown' }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const LearningProgressSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', index: true },

  skills: { type: SkillsSchema, default: () => ({}) },

  missions: { type: MissionsSchema, default: () => ({}) },

  streaks: { type: StreaksSchema, default: () => ({}) },

  achievements: { type: AchievementsSchema, default: () => ({}) },

  analytics: { type: AnalyticsSchema, default: () => ({}) },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,                            // createdAt / updatedAt
  collection: 'ecoorbit_progress'
});

/* ---------------------- Indexes ---------------------- */

LearningProgressSchema.index({ profileId: 1, classId: 1 }, { unique: true, sparse: true });
LearningProgressSchema.index({ 'missions.completed.completedAt': -1 });
LearningProgressSchema.index({ 'streaks.lastActivity': -1 });
LearningProgressSchema.index({ 'analytics.averageScore': -1 });
LearningProgressSchema.index({ 'missions.inProgress.missionId': 1 });

/* ---------------------- Static Query Helpers (data-only) ---------------------- */

LearningProgressSchema.statics.findByProfile = function (profileId) {
  return this.find({ profileId, isActive: true }).sort({ updatedAt: -1 });
};

LearningProgressSchema.statics.findClassLeaderboard = function (classId, limit = 20) {
  // Sort by averageScore (desc), then totalTime (desc) as a tie-breaker
  return this.find({ classId, isActive: true })
    .sort({ 'analytics.averageScore': -1, 'analytics.totalTime': -1 })
    .limit(limit);
};

LearningProgressSchema.statics.upsertForProfileClass = function (profileId, classId, update) {
  return this.findOneAndUpdate(
    { profileId, classId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('LearningProgress', LearningProgressSchema);
