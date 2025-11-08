// models/orbitwatch/SpaceObject.js
const mongoose = require('mongoose');

const TleSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  epoch: Date
}, { _id: false });

const OrbitalElementsSchema = new mongoose.Schema({
  inclination: Number,       // degrees
  raan: Number,              // Right Ascension of Ascending Node
  eccentricity: Number,
  argOfPerigee: Number,
  meanAnomaly: Number,
  meanMotion: Number         // rev/day
}, { _id: false });

const OrbitalDataSchema = new mongoose.Schema({
  tle: TleSchema,
  elements: OrbitalElementsSchema,
  period: Number,            // minutes
  apogee: Number,            // km
  perigee: Number,           // km
  semiMajorAxis: Number      // km
}, { _id: false });

const PhysicalSchema = new mongoose.Schema({
  mass: Number,              // kg
  size: String,              // "small", "medium", "large"
  shape: String,
  radarCrossSection: Number
}, { _id: false });

const StatusSchema = new mongoose.Schema({
  launchDate: Date,
  decayDate: Date,
  operational: Boolean,
  country: String,
  operator: String
}, { _id: false });

const RiskSchema = new mongoose.Schema({
  collisionProbability: Number,     // 0-1
  debrisGenerationPotential: Number,// 0-100
  environmentalImpact: Number,      // 0-100
  lastUpdated: Date
}, { _id: false });

const SpaceObjectSchema = new mongoose.Schema({
  noradId: { type: Number, unique: true, sparse: true },
  name: { type: String, required: true },
  internationalDesignator: String,

  objectType: {
    type: String,
    enum: ['payload', 'rocket-body', 'debris', 'unknown'],
    required: true
  },

  classification: {
    type: String,
    enum: ['classified', 'unclassified'],
    default: 'unclassified'
  },

  physicalProperties: PhysicalSchema,
  orbitalData: OrbitalDataSchema,
  status: StatusSchema,
  riskAssessment: RiskSchema,

  source: { type: String, default: 'space-track' },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true
});

// Indexes
SpaceObjectSchema.index({ noradId: 1 });
SpaceObjectSchema.index({ objectType: 1 });
SpaceObjectSchema.index({ 'status.operational': 1 });
SpaceObjectSchema.index({ 'riskAssessment.collisionProbability': -1 });

// Basic queries only (MVCS)
SpaceObjectSchema.statics.findByNORAD = function(id) {
  return this.findOne({ noradId: id, isActive: true });
};

SpaceObjectSchema.statics.findActivePayloads = function() {
  return this.find({
    objectType: 'payload',
    'status.operational': true,
    isActive: true
  });
};

module.exports = mongoose.model('SpaceObject', SpaceObjectSchema);
