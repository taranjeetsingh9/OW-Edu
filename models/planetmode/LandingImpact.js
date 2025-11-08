// models/planetmode/LandingImpact.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const CoordinatesSchema = new Schema({
  lat: { type: Number, min: [-90, 'Latitude cannot be less than -90'], max: [90, 'Latitude cannot exceed 90'] },
  lng: { type: Number, min: [-180, 'Longitude cannot be less than -180'], max: [180, 'Longitude cannot exceed 180'] }
}, { _id: false });

const SiteSchema = new Schema({
  name: { type: String, trim: true },
  coordinates: { type: CoordinatesSchema, default: () => ({}) },
  elevation: Number,                 // meters
  terrainType: { type: String, trim: true }
}, { _id: false });

const CraterSchema = new Schema({
  diameter: { type: Number, min: 0 }, // meters
  depth: { type: Number, min: 0 },    // meters
  volume: { type: Number, min: 0 }    // m^3
}, { _id: false });

const DustSchema = new Schema({
  radius: { type: Number, min: 0 },   // meters
  height: { type: Number, min: 0 },   // meters
  duration: { type: Number, min: 0 }  // seconds
}, { _id: false });

const SeismicSchema = new Schema({
  magnitude: { type: Number, min: 0 }, // unitless model scale or ML
  radius: { type: Number, min: 0 }     // meters
}, { _id: false });

const ContaminationSchema = new Schema({
  level: { type: Number, min: [0, 'Level cannot be negative'], max: [10, 'Level cannot exceed 10'] },
  type: { type: String, enum: ['chemical', 'biological', 'mechanical', 'unknown'], default: 'unknown' }
}, { _id: false });

const AtmosphericEffectSchema = new Schema({
  blackCarbon: { type: Number, min: 0 },  // kg
  waterVapor: { type: Number, min: 0 },   // kg
  nox: { type: Number, min: 0 },          // kg
  alumina: { type: Number, min: 0 }       // kg (solid motors)
}, { _id: false });

const FootprintSchema = new Schema({
  // Optional GeoJSON footprint of dust/seismic impact zones (2D projected)
  type: { type: String, enum: ['FeatureCollection'], default: 'FeatureCollection' },
  features: { type: Array, default: [] } // store raw GeoJSON features
}, { _id: false });

const ScoresSchema = new Schema({
  environmentalImpact: { type: Number, min: 0, max: 100 }, // lower is better
  safety: { type: Number, min: 0, max: 100 },
  scientificValue: { type: Number, min: 0, max: 100 },
  overall: { type: Number, min: 0, max: 100 }
}, { _id: false });

const InputsSchema = new Schema({
  payloadMass: { type: Number, min: 0 },   // kg
  vehicleName: { type: String, trim: true },
  descentProfile: { type: String, enum: ['direct', 'hover', 'sky-crane', 'propulsive', 'parachute', 'unknown'], default: 'unknown' },
  engineEfficiency: { type: Number, min: 0, max: 1 }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const LandingImpactSchema = new Schema({
  missionId: { type: Schema.Types.ObjectId, ref: 'LandingMission', required: true, index: true },
  bodyId: { type: Schema.Types.ObjectId, ref: 'CelestialBody', required: true, index: true },

  site: { type: SiteSchema, default: () => ({}) },

  inputs: { type: InputsSchema, default: () => ({}) },

  crater: { type: CraterSchema, default: () => ({}) },
  dustPlume: { type: DustSchema, default: () => ({}) },
  seismic: { type: SeismicSchema, default: () => ({}) },
  contamination: { type: ContaminationSchema, default: () => ({}) },
  atmospheric: { type: AtmosphericEffectSchema, default: () => ({}) },

  footprint: { type: FootprintSchema, default: () => ({}) }, // optional GeoJSON footprint

  scores: { type: ScoresSchema, default: () => ({}) },

  status: { type: String, enum: ['draft', 'computed', 'approved', 'rejected'], default: 'draft', index: true },

  calculatedAt: Date,
  isPublic: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'planetmode_landing_impacts'
});

/* ---------------------- Indexes ---------------------- */

LandingImpactSchema.index({ bodyId: 1, 'scores.overall': -1 });
LandingImpactSchema.index({ isPublic: 1, status: 1 });
LandingImpactSchema.index({ 'site.coordinates.lat': 1, 'site.coordinates.lng': 1 });

/* ---------------------- Static Query Helpers ---------------------- */

LandingImpactSchema.statics.findByMission = function (missionId) {
  return this.find({ missionId, isActive: true }).sort({ createdAt: -1 });
};

LandingImpactSchema.statics.findPublicByBody = function (bodyId) {
  return this.find({ bodyId, isPublic: true, status: 'computed', isActive: true }).sort({ 'scores.overall': -1 });
};

LandingImpactSchema.statics.leaderboardLowImpact = function (bodyId, limit = 10) {
  // lower environmentalImpact is better
  return this.find({
    bodyId,
    isPublic: true,
    status: 'computed',
    isActive: true
  })
    .sort({ 'scores.environmentalImpact': 1 })
    .limit(limit);
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('LandingImpact', LandingImpactSchema);
