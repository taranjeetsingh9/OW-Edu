// models/planetmode/HistoricalMission.js
const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const CoordinatesSchema = new mongoose.Schema({
  lat: { type: Number, min: [-90, 'Latitude cannot be less than -90'], max: [90, 'Latitude cannot exceed 90'] },
  lng: { type: Number, min: [-180, 'Longitude cannot be less than -180'], max: [180, 'Longitude cannot exceed 180'] }
}, { _id: false });

const LandingSiteSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  officialName: { type: String, trim: true },
  coordinates: { type: CoordinatesSchema, default: () => ({}) }
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  mass: { type: Number, min: [0, 'Vehicle mass cannot be negative'] },
  dimensions: {
    length: { type: Number, min: [0, 'Length cannot be negative'] },
    width: { type: Number, min: [0, 'Width cannot be negative'] },
    height: { type: Number, min: [0, 'Height cannot be negative'] }
  },
  propulsion: String,
  payload: String
}, { _id: false });

const ResultsSchema = new mongoose.Schema({
  success: { type: Boolean, default: false },
  duration: { type: Number, min: [0, 'Duration cannot be negative'] },
  scienceReturn: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  samplesCollected: { type: Number, min: [0, 'Samples collected cannot be negative'] }
}, { _id: false });

const EnvironmentalImpactSchema = new mongoose.Schema({
  craterSize: { type: Number, min: [0, 'Crater size cannot be negative'] },
  dustDispersion: { type: Number, min: [0, 'Dust dispersion cannot be negative'] },
  contaminationRisk: { type: Number, min: [0, 'Contamination risk cannot be negative'] },
  historicalSignificance: {
    type: Number,
    min: [1, 'Historical significance must be between 1 and 10'],
    max: [10, 'Historical significance cannot exceed 10']
  }
}, { _id: false });

const TechnicalDataSchema = new mongoose.Schema({
  landingAccuracy: { type: Number, min: [0, 'Landing accuracy cannot be negative'] },
  fuelUsage: { type: Number, min: [0, 'Fuel usage cannot be negative'] },
  communicationDelay: { type: Number, min: [0, 'Communication delay cannot be negative'] }
}, { _id: false });

const MediaSchema = new mongoose.Schema({
  images: [{ type: String, validate: v => !v || /^https?:\/\/.+\..+/.test(v) }],
  videos: [{ type: String, validate: v => !v || /^https?:\/\/.+\..+/.test(v) }],
  documents: [{ type: String, validate: v => !v || /^https?:\/\/.+\..+/.test(v) }]
}, { _id: false });

const EducationalSchema = new mongoose.Schema({
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  concepts: [String],
  curriculumAlignment: [String]
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const HistoricalMissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mission name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Mission name cannot exceed 100 characters']
  },
  missionType: {
    type: String,
    enum: ['lunar-landing', 'mars-landing', 'orbital', 'flyby'],
    required: [true, 'Mission type is required']
  },
  agency: {
    type: String,
    required: [true, 'Agency name is required'],
    trim: true
  },
  launchDate: Date,
  landingDate: Date,
  bodyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CelestialBody',
    required: [true, 'Target celestial body is required']
  },
  landingSite: { type: LandingSiteSchema, default: () => ({}) },
  vehicle: { type: VehicleSchema, default: () => ({}) },
  results: { type: ResultsSchema, default: () => ({}) },
  environmentalImpact: { type: EnvironmentalImpactSchema, default: () => ({}) },
  technicalData: { type: TechnicalDataSchema, default: () => ({}) },
  media: { type: MediaSchema, default: () => ({}) },
  educationalValue: { type: EducationalSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'planetmode_historical'
});

/* ---------------------- Indexes ---------------------- */
HistoricalMissionSchema.index({ name: 1 }, { unique: true });
HistoricalMissionSchema.index({ missionType: 1 });
HistoricalMissionSchema.index({ agency: 1 });
HistoricalMissionSchema.index({ bodyId: 1 });
HistoricalMissionSchema.index({ 'results.success': 1 });
HistoricalMissionSchema.index({ isActive: 1 });

/* ---------------------- Static Methods ---------------------- */
HistoricalMissionSchema.statics.findByBody = function (bodyId) {
  return this.find({ bodyId, isActive: true }).sort({ launchDate: 1 });
};

HistoricalMissionSchema.statics.findSuccessfulMissions = function () {
  return this.find({ 'results.success': true, isActive: true });
};

HistoricalMissionSchema.statics.findByAgency = function (agency) {
  return this.find({ agency, isActive: true });
};

/* ---------------------- Export ---------------------- */
module.exports = mongoose.model('HistoricalMission', HistoricalMissionSchema);
