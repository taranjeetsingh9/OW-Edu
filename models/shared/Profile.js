const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const BadgeSchema = new mongoose.Schema({
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['environmental', 'technical', 'collaboration', 'exploration', 'achievement'],
    required: true
  },
  earnedAt: { type: Date, default: Date.now },
  icon: { type: String, required: true },
  description: String,
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' }
}, { _id: false });

const AchievementProgressSchema = new mongoose.Schema({
  achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  name: { type: String, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedAt: Date,
  rewardXp: { type: Number, default: 0 },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 }
}, { _id: false });

const UnitPreferencesSchema = new mongoose.Schema({
  distance: { type: String, enum: ['km', 'miles'], default: 'km' },
  mass: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
  temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
  velocity: { type: String, enum: ['km/s', 'm/s', 'mph'], default: 'km/s' }
}, { _id: false });

const ContentFilterSchema = new mongoose.Schema({
  showAdvancedPhysics: { type: Boolean, default: false },
  showRealisticDangers: { type: Boolean, default: false },
  showComplexCalculations: { type: Boolean, default: false },
  showTechnicalDetails: { type: Boolean, default: false },
  languageFilter: { type: Boolean, default: true }
}, { _id: false });

const ParentalControlSchema = new mongoose.Schema({
  maxPlayTime: { type: Number, default: 120 },
  contentRating: { type: String, enum: ['G', 'PG', 'PG-13', 'R'], default: 'PG' },
  spendingLimit: { type: Number, default: 0 },
  socialFeatures: { type: Boolean, default: false },
  chatRestrictions: { type: Boolean, default: true }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  completedMissions: [{
    missionId: { type: mongoose.Schema.Types.ObjectId, refPath: 'progress.completedMissions.missionType' },
    missionType: { type: String, enum: ['GreenLaunchMission', 'LandingMission', 'SpaceObjectAnalysis'], required: true },
    completedAt: { type: Date, default: Date.now },
    score: Number,
    timeSpent: Number
  }],
  currentMission: {
    missionId: mongoose.Schema.Types.ObjectId,
    missionType: String,
    startedAt: { type: Date, default: Date.now },
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  totalPlayTime: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivity: Date
  }
}, { _id: false });

const EducationalSchema = new mongoose.Schema({
  school: { type: String, trim: true },
  grade: { type: String, enum: ['6','7','8','9','10','11','12','college','university','other'] },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  learningPath: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' },
  skills: {
    type: Map,
    of: {
      level: { type: Number, min: 0, max: 100, default: 0 },
      xp: { type: Number, default: 0 },
      lastPracticed: Date
    },
    default: () => new Map()
  }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const ProfileSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
  profileName: {
    type: String,
    required: [true, 'Profile name is required'],
    trim: true,
    maxlength: [20, 'Profile name cannot exceed 20 characters'],
    minlength: [1, 'Profile name must be at least 1 character'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Profile name can only contain letters, numbers, and spaces']
  },
  avatar: { type: String, default: 'default-avatar-1' },
  role: { type: String, enum: ['student','teacher','parent','explorer','researcher'], default: 'explorer', required: true },
  ageGroup: { type: String, enum: ['child','teen','adult','educator'], required: true },

  preferences: {
    theme: { type: String, enum: ['dark','light','auto'], default: 'dark' },
    difficulty: { type: String, enum: ['beginner','intermediate','advanced','expert'], default: 'beginner' },
    units: { type: UnitPreferencesSchema, default: () => ({}) },
    contentFilters: { type: ContentFilterSchema, default: () => ({}) },
    audio: {
      soundEffects: { type: Boolean, default: true },
      backgroundMusic: { type: Boolean, default: true },
      narration: { type: Boolean, default: true }
    }
  },

  gamification: {
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1, max: 100 },
    coins: { type: Number, default: 0, min: 0 },
    badges: [BadgeSchema],
    achievements: [AchievementProgressSchema],
    leaderboard: { classRank: Number, schoolRank: Number, globalRank: Number }
  },

  educational: { type: EducationalSchema, default: () => ({}) },
  progress: { type: ProgressSchema, default: () => ({}) },

  restrictions: {
    isChildProfile: { type: Boolean, default: false },
    parentalControls: { type: ParentalControlSchema, default: () => ({}) }
  },

  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */
ProfileSchema.index({ accountId: 1, profileName: 1 }, { unique: true });
ProfileSchema.index({ 'gamification.xp': -1 });
ProfileSchema.index({ 'progress.lastActivity': -1 });
ProfileSchema.index({ role: 1 });
ProfileSchema.index({ 'educational.teacherId': 1 });
ProfileSchema.index({ 'educational.classIds': 1 });
ProfileSchema.index({ isActive: 1, 'gamification.level': -1 });

/* ---------------------- Virtuals ---------------------- */
ProfileSchema.virtual('xpForNextLevel').get(function () {
  return this.gamification.level * 1000;
});

ProfileSchema.virtual('levelProgress').get(function () {
  const xpForCurrent = (this.gamification.level - 1) * 1000;
  return ((this.gamification.xp - xpForCurrent) / 1000) * 100;
});

/* ---------------------- Export ---------------------- */

const Profile = mongoose.model('Profile', ProfileSchema);
module.exports = Profile;
