const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const SpecificationsSchema = new mongoose.Schema({
  height: { type: Number, required: true, min: [0, 'Height cannot be negative'] },
  diameter: { type: Number, required: true, min: [0, 'Diameter cannot be negative'] },
  mass: { type: Number, required: true, min: [0, 'Mass cannot be negative'] },
  stages: { type: Number, required: true, min: [1, 'Must have at least 1 stage'], max: [5, 'Cannot have more than 5 stages'] },
  thrust: { type: Number, required: true, min: [0, 'Thrust cannot be negative'] },
  payloadCapacity: {
    leo: { type: Number, required: true, min: [0, 'Payload capacity cannot be negative'] },
    gto: { type: Number, min: [0, 'Payload capacity cannot be negative'] },
    moon: { type: Number, min: [0, 'Payload capacity cannot be negative'] },
    mars: { type: Number, min: [0, 'Payload capacity cannot be negative'] },
    sso: { type: Number, min: [0, 'Payload capacity cannot be negative'] }
  },
  fairing: {
    diameter: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    volume: { type: Number, min: 0 }
  }
}, { _id: false });

const PropulsionSchema = new mongoose.Schema({
  engine: { type: String, required: true, trim: true },
  fuelType: {
    type: String,
    enum: ['rp1-lox', 'lh2-lox', 'methalox', 'solid', 'hypergolic', 'hybrid', 'electric'],
    required: true
  },
  specificImpulse: {
    vacuum: { type: Number, required: true, min: [0, 'Specific impulse cannot be negative'] },
    seaLevel: { type: Number, min: [0, 'Specific impulse cannot be negative'] }
  },
  thrustToWeight: { type: Number, min: [0, 'Thrust-to-weight ratio cannot be negative'] },
  chamberPressure: Number,
  mixtureRatio: Number,
  burnTime: Number
}, { _id: false });

const StageSchema = new mongoose.Schema({
  stageNumber: { type: Number, required: true, min: 1 },
  name: String,
  engines: Number,
  fuelType: String,
  thrust: Number,
  burnTime: Number,
  specificImpulse: Number,
  reusable: Boolean
}, { _id: false });

const EnvironmentalSchema = new mongoose.Schema({
  emissions: {
    co2PerKg: { type: Number, required: true, min: [0, 'CO2 emissions cannot be negative'] },
    noxPerKg: { type: Number, min: [0, 'NOx emissions cannot be negative'] },
    blackCarbonPerKg: { type: Number, min: [0, 'Black carbon emissions cannot be negative'] },
    waterVaporPerKg: { type: Number, min: [0, 'Water vapor emissions cannot be negative'] },
    aluminaPerKg: { type: Number, min: [0, 'Alumina emissions cannot be negative'] }
  },
  sustainabilityScore: {
    type: Number,
    min: [0, 'Sustainability score cannot be negative'],
    max: [100, 'Sustainability score cannot exceed 100'],
    default: 50
  },
  environmentalImpact: {
    ozoneDepletion: Number,
    globalWarming: Number,
    localPollution: Number,
    resourceEfficiency: Number
  },
  greenAlternatives: [{
    fuelType: String,
    improvement: Number,
    feasibility: { type: String, enum: ['high', 'medium', 'low'] }
  }]
}, { _id: false });

const ReusabilitySchema = new mongoose.Schema({
  isReusable: { type: Boolean, required: true, default: false },
  reuseCount: { type: Number, default: 0, min: [0, 'Reuse count cannot be negative'] },
  maxReuses: { type: Number, min: [0, 'Maximum reuses cannot be negative'] },
  turnaroundTime: { type: Number, min: [0, 'Turnaround time cannot be negative'] },
  recoveryMethod: { type: String, enum: ['parachute', 'propulsive', 'helicopter', 'none'], default: 'none' },
  refurbishmentCost: { type: Number, min: [0, 'Refurbishment cost cannot be negative'], max: [100, 'Refurbishment cost cannot exceed 100%'] }
}, { _id: false });

const CostSchema = new mongoose.Schema({
  development: { type: Number, min: [0, 'Development cost cannot be negative'] },
  launch: { type: Number, required: true, min: [0, 'Launch cost cannot be negative'] },
  perKg: { type: Number, min: [0, 'Cost per kg cannot be negative'] },
  operational: { type: Number, min: [0, 'Operational cost cannot be negative'] },
  insurance: { type: Number, min: [0, 'Insurance cost cannot be negative'] }
}, { _id: false });

const LaunchHistorySchema = new mongoose.Schema({
  totalLaunches: { type: Number, default: 0, min: [0, 'Total launches cannot be negative'] },
  successfulLaunches: { type: Number, default: 0, min: [0, 'Successful launches cannot be negative'] },
  successRate: {
    type: Number,
    min: [0, 'Success rate cannot be negative'],
    max: [100, 'Success rate cannot exceed 100%'],
    default: 0
  },
  lastLaunch: Date,
  nextLaunch: Date
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const RocketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rocket name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Rocket name cannot exceed 50 characters']
  },
  manufacturer: { type: String, required: [true, 'Manufacturer is required'], trim: true },
  country: { type: String, required: true, default: 'International' },
  type: {
    type: String,
    enum: ['small-lift', 'medium-lift', 'heavy-lift', 'super-heavy', 'experimental'],
    required: true
  },
  variant: String,
  specifications: { type: SpecificationsSchema, required: true },
  propulsion: { type: PropulsionSchema, required: true },
  stages: [StageSchema],
  environmental: { type: EnvironmentalSchema, required: true },
  reusability: { type: ReusabilitySchema, required: true },
  cost: { type: CostSchema, required: true },
  launchHistory: { type: LaunchHistorySchema, default: () => ({}) },

  status: {
    type: String,
    enum: ['active', 'retired', 'development', 'concept', 'prototype', 'cancelled'],
    default: 'active'
  },
  firstLaunch: Date,
  retirementDate: Date,

  imageUrl: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+\..+/.test(v),
      message: 'Invalid image URL format'
    }
  },
  gallery: [String],
  description: { type: String, maxlength: [1000, 'Description cannot exceed 1000 characters'] },
  tags: [String],
  educational: {
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    concepts: [String],
    curriculumAlignment: [String]
  },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */
RocketSchema.index({ name: 1 }, { unique: true });
RocketSchema.index({ manufacturer: 1 });
RocketSchema.index({ type: 1 });
RocketSchema.index({ status: 1 });
RocketSchema.index({ 'specifications.payloadCapacity.leo': -1 });
RocketSchema.index({ 'environmental.sustainabilityScore': -1 });
RocketSchema.index({ isActive: 1 });

/* ---------------------- Static Data Methods ---------------------- */
RocketSchema.statics.findActiveRockets = function () {
  return this.find({ status: 'active', isActive: true });
};

RocketSchema.statics.findByManufacturer = function (manufacturer) {
  return this.find({ manufacturer, isActive: true });
};

RocketSchema.statics.findReusableRockets = function () {
  return this.find({ 'reusability.isReusable': true, status: 'active', isActive: true });
};

/* ---------------------- Export ---------------------- */
module.exports = mongoose.model('Rocket', RocketSchema);
