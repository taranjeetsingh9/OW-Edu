// models/planetmode/LandingMission.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const CoordinatesSchema = new Schema({
  lat: { type: Number, min: [-90, 'Latitude cannot be less than -90'], max: [90, 'Latitude cannot exceed 90'] },
  lng: { type: Number, min: [-180, 'Longitude cannot be less than -180'], max: [180, 'Longitude cannot exceed 180'] }
}, { _id: false });

const LandingSiteSchema = new Schema({
  name: { type: String, trim: true },
  coordinates: { type: CoordinatesSchema, default: () => ({}) },
  elevation: Number,              // meters
  terrainType: { type: String, trim: true }
}, { _id: false });

const VehicleSchema = new Schema({
  // Keep your free-form name, but optionally allow linking to Rocket
  name: { type: String, trim: true },          // e.g., "Apollo LM", "Starship", "Advanced Lander"
  rocketId: { type: Schema.Types.ObjectId, ref: 'Rocket' }, // optional cross-ref
  specifications: { type: Map, of: Schema.Types.Mixed }     // era-specific vehicle data
}, { _id: false });

const ApproachSchema = new Schema({
  entryAngle: Number,     // degrees
  initialVelocity: Number, // m/s
  descentProfile: { type: String, enum: ['direct', 'hover', 'sky-crane', 'propulsive', 'parachute', 'unknown'], default: 'unknown' }
}, { _id: false });

const ScenarioSchema = new Schema({
  bodyId: { type: Schema.Types.ObjectId, ref: 'CelestialBody', required: [true, 'Target body is required'] },
  landingSite: { type: LandingSiteSchema, default: () => ({}) },
  vehicle: { type: VehicleSchema, default: () => ({}) },
  approach: { type: ApproachSchema, default: () => ({}) }
}, { _id: false });

const SimulationInputsSchema = new Schema({
  payloadMass: { type: Number, min: [0, 'Payload mass cannot be negative'] }, // kg
  fuelMass: { type: Number, min: [0, 'Fuel mass cannot be negative'] },       // kg
  engineEfficiency: { type: Number, min: [0, 'Engine efficiency cannot be negative'], max: [1, 'Engine efficiency must be <= 1'] },
  guidanceType: { type: String, enum: ['manual', 'auto', 'ai'], default: 'auto' }
}, { _id: false });

const SimulationResultsSchema = new Schema({
  success: { type: Boolean, default: false },
  landingAccuracy: { type: Number, min: [0, 'Landing accuracy cannot be negative'] }, // meters
  fuelRemaining: { type: Number, min: [0, 'Fuel remaining cannot be negative'] },     // kg
  duration: { type: Number, min: [0, 'Duration cannot be negative'] }                 // seconds
}, { _id: false });

const ImpactCraterSchema = new Schema({
  diameter: { type: Number, min: 0 },
  depth: { type: Number, min: 0 },
  volume: { type: Number, min: 0 }
}, { _id: false });

const ImpactDustSchema = new Schema({
  radius: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  duration: { type: Number, min: 0 }
}, { _id: false });

const ImpactSeismicSchema = new Schema({
  magnitude: { type: Number, min: 0 },
  radius: { type: Number, min: 0 }
}, { _id: false });

const ImpactContaminationSchema = new Schema({
  level: { type: Number, min: [0, 'Contamination level cannot be negative'], max: [10, 'Contamination level cannot exceed 10'] },
  type: { type: String, enum: ['chemical', 'biological', 'mechanical', 'unknown'], default: 'unknown' }
}, { _id: false });

const ImpactSchema = new Schema({
  crater: { type: ImpactCraterSchema, default: () => ({}) },
  dustPlume: { type: ImpactDustSchema, default: () => ({}) },
  seismic: { type: ImpactSeismicSchema, default: () => ({}) },
  contamination: { type: ImpactContaminationSchema, default: () => ({}) }
}, { _id: false });

const SimulationSchema = new Schema({
  inputs: { type: SimulationInputsSchema, default: () => ({}) },
  results: { type: SimulationResultsSchema, default: () => ({}) },
  impact: { type: ImpactSchema, default: () => ({}) }
}, { _id: false });

const ScoringSchema = new Schema({
  environmentalImpact: { type: Number, min: 0, max: 100 }, // lower better
  scientificValue: { type: Number, min: 0, max: 100 },
  safety: { type: Number, min: 0, max: 100 },
  efficiency: { type: Number, min: 0, max: 100 },
  overall: { type: Number, min: 0, max: 100 }
}, { _id: false });

const ComparisonSchema = new Schema({
  historicalBaseline: { type: Schema.Types.ObjectId, ref: 'HistoricalMission' },
  improvement: Number,     // %
  industryAverage: Number  // %
}, { _id: false });

const TimestampsSchema = new Schema({
  createdAt: Date,
  simulatedAt: Date,
  completedAt: Date
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const LandingMissionSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },

  missionName: { type: String, required: true, trim: true, maxlength: [100, 'Mission name cannot exceed 100 characters'] },

  era: {
    type: String,
    enum: ['historical', 'current', 'future'],
    required: true
  },

  scenario: { type: ScenarioSchema, required: true },

  simulation: { type: SimulationSchema, default: () => ({}) },

  scoring: { type: ScoringSchema, default: () => ({}) },

  comparison: { type: ComparisonSchema, default: () => ({}) },

  timestampsBlock: { type: TimestampsSchema, default: () => ({}) }, // avoid name clash with mongoose timestamps

  status: {
    type: String,
    enum: ['draft', 'running', 'completed', 'failed'],
    default: 'draft',
    index: true
  },

  isPublic: { type: Boolean, default: false, index: true },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,                 // adds createdAt / updatedAt at top level
  collection: 'planetmode_landings'
});

/* ---------------------- Indexes ---------------------- */

LandingMissionSchema.index({ missionName: 1, profileId: 1 });
LandingMissionSchema.index({ 'scenario.bodyId': 1 });
LandingMissionSchema.index({ 'simulation.results.success': 1 });
LandingMissionSchema.index({ 'scoring.overall': -1 });
LandingMissionSchema.index({ isPublic: 1, status: 1 });
LandingMissionSchema.index({ 'timestampsBlock.simulatedAt': -1 });

/* ---------------------- Static Query Helpers ---------------------- */

LandingMissionSchema.statics.findPublicCompletedByBody = function (bodyId) {
  return this.find({
    isPublic: true,
    status: 'completed',
    isActive: true,
    'scenario.bodyId': bodyId
  }).sort({ 'scoring.overall': -1 });
};

LandingMissionSchema.statics.findByProfile = function (profileId) {
  return this.find({ profileId, isActive: true }).sort({ createdAt: -1 });
};

LandingMissionSchema.statics.findRunning = function () {
  return this.find({ status: 'running', isActive: true });
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('LandingMission', LandingMissionSchema);
