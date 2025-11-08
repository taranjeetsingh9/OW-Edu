// models/greenlaunch/GreenLaunchMission.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const DestinationSchema = new Schema({
  bodyId: { type: Schema.Types.ObjectId, ref: 'CelestialBody' },
  orbitType: { type: String, trim: true },          // e.g., LEO, GTO, SSO, NRHO
  altitude: { type: Number, min: 0 },               // km
  inclination: { type: Number, min: 0, max: 180 }   // deg
}, { _id: false });

const PayloadSchema = new Schema({
  mass: { type: Number, min: 0 },   // kg
  type: { type: String, trim: true },
  description: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const TrajectorySchema = new Schema({
  type: { type: String, trim: true },     // e.g., Hohmann, Direct, Free-return
  transferTime: { type: Number, min: 0 }, // days
  deltaV: { type: Number, min: 0 }        // m/s
}, { _id: false });

const ConfigurationSchema = new Schema({
  launchSiteId: { type: Schema.Types.ObjectId, ref: 'LaunchSite' },
  rocketId: { type: Schema.Types.ObjectId, ref: 'Rocket' },
  destination: { type: DestinationSchema, default: () => ({}) },
  payload: { type: PayloadSchema, default: () => ({}) },
  trajectory: { type: TrajectorySchema, default: () => ({}) }
}, { _id: false });

const CalculationsSchema = new Schema({
  emissions: {
    co2: { type: Number, min: 0 },          // kg
    nox: { type: Number, min: 0 },          // kg
    blackCarbon: { type: Number, min: 0 },  // kg
    waterVapor: { type: Number, min: 0 },   // kg
    totalEquivalent: { type: Number, min: 0 } // car-years (snapshot)
  },
  efficiency: {
    fuelUsed: { type: Number, min: 0 },     // kg
    payloadRatio: { type: Number, min: 0 }, // payload/total mass
    costPerKg: { type: Number, min: 0 }     // USD/kg
  },
  scores: {
    sustainability: { type: Number, min: 0, max: 100 },
    environmental: { type: Number, min: 0, max: 100 },
    economic: { type: Number, min: 0, max: 100 },
    overall: { type: Number, min: 0, max: 100 }
  }
}, { _id: false });

const SuggestionSchema = new Schema({
  type: { type: String, enum: ['fuel-change', 'trajectory-optimization', 'payload-optimization', 'launch-site-change', 'vehicle-selection', 'mission-profile'] },
  description: { type: String, trim: true },
  improvement: { type: Number, min: 0 },   // %
  impact: { type: String, enum: ['high', 'medium', 'low'] }
}, { _id: false });

const OptimizationSchema = new Schema({
  suggestions: [SuggestionSchema],
  applied: { type: Boolean, default: false },
  beforeScores: { type: Map, of: Number, default: undefined },
  afterScores: { type: Map, of: Number, default: undefined }
}, { _id: false });

const SimulationDataSchema = new Schema({
  runAt: Date,
  duration: { type: Number, min: 0 }, // seconds
  success: { type: Boolean, default: false },
  errors: [String]
}, { _id: false });

const MissionTimestampsSchema = new Schema({
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const GreenLaunchMissionSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },

  missionName: { type: String, required: true, trim: true, maxlength: 100 },

  missionType: {
    type: String,
    enum: ['educational', 'commercial', 'scientific', 'crew'],
    required: true
  },

  configuration: { type: ConfigurationSchema, required: true },

  // Snapshot numbers kept on the mission for quick reads (full details live in GreenLaunchCalculation)
  calculations: { type: CalculationsSchema, default: () => ({}) },

  optimization: { type: OptimizationSchema, default: () => ({}) },

  status: {
    type: String,
    enum: ['draft', 'simulated', 'optimized', 'completed'],
    default: 'draft',
    index: true
  },

  simulationData: { type: SimulationDataSchema, default: () => ({}) },

  missionTimestamps: { type: MissionTimestampsSchema, default: () => ({}) },

  isPublic: { type: Boolean, default: false, index: true },

  tags: [String],

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true, // adds createdAt/updatedAt at top level
  collection: 'greenlaunch_missions'
});

/* ---------------------- Indexes ---------------------- */

GreenLaunchMissionSchema.index({ missionName: 1, profileId: 1 });
GreenLaunchMissionSchema.index({ 'configuration.rocketId': 1 });
GreenLaunchMissionSchema.index({ 'configuration.launchSiteId': 1 });
GreenLaunchMissionSchema.index({ 'configuration.destination.bodyId': 1 });
GreenLaunchMissionSchema.index({ 'calculations.scores.overall': -1 });

/* ---------------------- Static Query Helpers ---------------------- */

GreenLaunchMissionSchema.statics.findByProfile = function (profileId) {
  return this.find({ profileId, isActive: true }).sort({ createdAt: -1 });
};

GreenLaunchMissionSchema.statics.findPublicCompletedByBody = function (bodyId) {
  return this.find({
    isPublic: true,
    status: 'completed',
    isActive: true,
    'configuration.destination.bodyId': bodyId
  }).sort({ 'calculations.scores.overall': -1 });
};

GreenLaunchMissionSchema.statics.findDrafts = function (profileId) {
  return this.find({ profileId, status: 'draft', isActive: true }).sort({ updatedAt: -1 });
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('GreenLaunchMission', GreenLaunchMissionSchema);
