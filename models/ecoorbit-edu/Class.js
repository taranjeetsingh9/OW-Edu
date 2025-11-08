// models/ecoorbit-edu/Class.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const StudentSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['student', 'assistant'], default: 'student' }
}, { _id: false });

const OntarioAlignmentSchema = new Schema({
  code: { type: String, trim: true },
  strand: { type: String, trim: true },
  expectation: { type: String, trim: true }
}, { _id: false });

const CurriculumSchema = new Schema({
  ontarioAlignments: [OntarioAlignmentSchema],
  learningGoals: [String],
  assessmentMethods: [String]
}, { _id: false });

const SettingsSchema = new Schema({
  joinCode: { type: String, index: true, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  allowStudentCollaboration: { type: Boolean, default: true },
  parentalAccess: { type: Boolean, default: false }
}, { _id: false });

/* ---------------------- Grade Enum ---------------------- */

const gradeEnum = [
  'K',               // Kindergarten
  '1','2','3','4','5','6','7','8',
  '9','10','11','12',
  'mixed',           // multi-grade classroom
  'college',
  'university',
  'other'
];

/* ---------------------- Main Schema ---------------------- */

const ClassSchema = new Schema({
  className: { type: String, required: true, trim: true, maxlength: 120 },
  school: { type: String, required: true, trim: true, maxlength: 200 },
  
  gradeLevel: { 
    type: String, 
    enum: gradeEnum, 
    required: true 
  },

  subject: { type: String, required: true, trim: true, maxlength: 80 },

  teacherId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },

  students: [StudentSchema],

  settings: { type: SettingsSchema, default: () => ({}) },

  curriculum: { type: CurriculumSchema, default: () => ({}) },

  status: { type: String, enum: ['active', 'archived', 'draft'], default: 'active', index: true },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'ecoorbit_classes'
});

/* ---------------------- Indexes ---------------------- */
ClassSchema.index({ className: 1, school: 1, teacherId: 1 });
ClassSchema.index({ 'students.profileId': 1 });
ClassSchema.index({ 'settings.joinCode': 1 }, { unique: true, sparse: true });
ClassSchema.index({ gradeLevel: 1 });
ClassSchema.index({ status: 1, isActive: 1 });

/* ---------------------- Query Helpers ---------------------- */
ClassSchema.statics.findByTeacher = function (teacherId) {
  return this.find({ teacherId, isActive: true }).sort({ createdAt: -1 });
};

ClassSchema.statics.findByGrade = function (gradeLevel) {
  return this.find({ gradeLevel, status: 'active', isActive: true }).sort({ className: 1 });
};

ClassSchema.statics.findByJoinCode = function (joinCode) {
  return this.findOne({
    'settings.joinCode': joinCode,
    isActive: true,
    status: { $in: ['active','draft'] }
  });
};

module.exports = mongoose.model('Class', ClassSchema);
