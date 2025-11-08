// models/ecoorbit-edu/Assignment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const MissionConstraintsSchema = new Schema({
  maxEmissions: { type: Number, min: 0 },
  minEfficiency: { type: Number, min: 0 },
  requiredTechniques: [String]
}, { _id: false });

const MissionConfigSchema = new Schema({
  feature: { type: String, enum: ['greenlaunch', 'orbitwatch', 'planetmode'], required: true },
  // free-form knobs per feature (kept typed)
  parameters: { type: Map, of: Schema.Types.Mixed, default: undefined },
  constraints: { type: MissionConstraintsSchema, default: () => ({}) }
}, { _id: false });

const RequirementsSchema = new Schema({
  dueDate: { type: Date },
  points: { type: Number, min: 0 },
  groupSize: { type: Number, min: 1, default: 1 }, // 1 = individual
  submissionsAllowed: { type: Number, min: 1, default: 1 },
  lateSubmission: { type: Boolean, default: false }
}, { _id: false });

const RubricItemSchema = new Schema({
  criterion: { type: String, trim: true, required: true },
  description: { type: String, trim: true },
  maxPoints: { type: Number, min: 0, required: true },
  weight: { type: Number, min: 0, max: 1 } // optional fractional weight (0..1)
}, { _id: false });

const GradingSchema = new Schema({
  rubric: [RubricItemSchema],
  totalPoints: { type: Number, min: 0 },
  autoGrade: { type: Boolean, default: false }
}, { _id: false });

const ResourceSchema = new Schema({
  type: { type: String, enum: ['document', 'video', 'link'], required: true },
  title: { type: String, trim: true, required: true },
  url: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+/i.test(v),
      message: 'Invalid resource URL'
    }
  },
  description: { type: String, trim: true }
}, { _id: false });

const SubmissionSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  // Polymorphic mission reference
  missionModel: {
    type: String,
    enum: ['GreenLaunchMission', 'LandingMission', 'OrbitData'],
    required: false
  },
  missionId: {
    type: Schema.Types.ObjectId,
    refPath: 'submissions.missionModel' // NOTE: path resolves at array element level
  },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0 },
  feedback: { type: String, trim: true },
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const AssignmentSchema = new Schema({
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },

  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true },

  type: {
    type: String,
    enum: ['mission', 'quiz', 'project', 'discussion', 'research'],
    required: true,
    index: true
  },

  missionConfig: { type: MissionConfigSchema, default: undefined }, // only for type='mission'

  requirements: { type: RequirementsSchema, default: () => ({}) },

  grading: { type: GradingSchema, default: () => ({}) },

  resources: [ResourceSchema],

  submissions: [SubmissionSchema],

  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
    index: true
  },

  isActive: { type: Boolean, default: true, index: true },

  // Optional tags for search/filtering
  tags: [String]
}, {
  timestamps: true, // createdAt / updatedAt
  collection: 'ecoorbit_assignments'
});

/* ---------------------- Indexes ---------------------- */

AssignmentSchema.index({ classId: 1, status: 1 });
AssignmentSchema.index({ 'requirements.dueDate': 1 });
AssignmentSchema.index({ type: 1, isActive: 1 });
AssignmentSchema.index({ 'submissions.profileId': 1 });
AssignmentSchema.index({ title: 'text', description: 'text' }); // quick search

/* ---------------------- Static Query Helpers (data-only) ---------------------- */

AssignmentSchema.statics.findByClass = function (classId) {
  return this.find({ classId, isActive: true }).sort({ createdAt: -1 });
};

AssignmentSchema.statics.findPublished = function (classId) {
  return this.find({ classId, status: 'published', isActive: true }).sort({ 'requirements.dueDate': 1 });
};

AssignmentSchema.statics.dueSoon = function (classId, days = 7) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return this.find({
    classId,
    isActive: true,
    status: 'published',
    'requirements.dueDate': { $gte: now, $lte: end }
  }).sort({ 'requirements.dueDate': 1 });
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('Assignment', AssignmentSchema);
