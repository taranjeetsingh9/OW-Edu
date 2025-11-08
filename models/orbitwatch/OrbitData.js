// models/orbitwatch/OrbitData.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const TLESnapshotSchema = new Schema({
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  epoch: { type: Date }
}, { _id: false });

const ElementsSchema = new Schema({
  inclination:   { type: Number, min: 0, max: 180 },
  raan:          { type: Number, min: 0, max: 360 },
  eccentricity:  { type: Number, min: 0, max: 1 },
  argOfPerigee:  { type: Number, min: 0, max: 360 },
  meanAnomaly:   { type: Number, min: 0, max: 360 },
  meanMotion:    { type: Number, min: 0 },        // rev/day
  semiMajorAxis: { type: Number, min: 0 }         // km (optional if computed elsewhere)
}, { _id: false });

const Vector3Schema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  z: { type: Number, required: true }
}, { _id: false });

const StateVectorSchema = new Schema({
  position: { type: Vector3Schema },  // km (ECI)
  velocity: { type: Vector3Schema }   // km/s (ECI)
}, { _id: false });

const CovarianceSchema = new Schema({
  // flattened 6x6 covariance upper triangle (21 values) or full 36 if you prefer
  // keep flexible with Mixed to avoid schema churn
  matrix: { type: [Number] },  // e.g., length 21 or 36
  frame: { type: String, enum: ['ECI', 'RTN', 'LVLH', 'TNW', 'other'], default: 'ECI' }
}, { _id: false });

const ObservationSchema = new Schema({
  sensor: { type: String, trim: true },         // e.g., sensor code/station id
  type: { type: String, enum: ['angle', 'range', 'doppler', 'optical', 'radar', 'other'], default: 'other' },
  residual: Number,                              // units depend on type
  snr: Number,
  meta: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

const QualitySchema = new Schema({
  source: { type: String, trim: true },         // e.g., 'space-track', 'internal-fusion'
  reliability: { type: Number, min: 0, max: 1 },
  rms: Number,
  flags: [String]
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const OrbitDataSchema = new Schema({
  objectId: { type: Schema.Types.ObjectId, ref: 'SpaceObject', required: true, index: true },

  // What kind of record is this?
  kind: { 
    type: String, 
    enum: ['tle', 'propagated', 'state', 'observation'], 
    required: true, 
    index: true 
  },

  // Time tag for the record (epoch or observation time)
  epoch: { type: Date, required: true, index: true },

  // Raw TLE snapshot (when kind === 'tle')
  tle: { type: TLESnapshotSchema, default: undefined },

  // Classical elements (optional snapshot if computed)
  elements: { type: ElementsSchema, default: undefined },

  // State vector (ECI) (when kind in ['state','propagated'])
  state: { type: StateVectorSchema, default: undefined },

  // Optional covariance for estimation/OD
  covariance: { type: CovarianceSchema, default: undefined },

  // Observation payload (when kind === 'observation')
  observation: { type: ObservationSchema, default: undefined },

  // Frame tags for state/covariance (if present)
  frame: { type: String, enum: ['ECI', 'ITRF', 'TEME', 'RTN', 'LVLH', 'other'], default: 'ECI' },

  // Data quality & provenance
  quality: { type: QualitySchema, default: () => ({}) },

  // Optional scenario tag for grouping (e.g., “campaign-2025-11”)
  batchTag: { type: String, trim: true, index: true },

  // Ops flags
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'orbitwatch_orbitdata'
});

/* ---------------------- Indexes ---------------------- */

// Common query: one object over time, filter by kind
OrbitDataSchema.index({ objectId: 1, kind: 1, epoch: -1 });
// Recent high-quality states
OrbitDataSchema.index({ kind: 1, 'quality.reliability': -1, epoch: -1 });
// Quick element-based filters (e.g., find snapshots in SSO-ish inclinations)
OrbitDataSchema.index({ 'elements.inclination': 1, epoch: -1 });

/* ---------------------- Static Query Helpers ---------------------- */

OrbitDataSchema.statics.latestState = function (objectId) {
  return this.findOne({ objectId, kind: { $in: ['state', 'propagated'] }, isActive: true })
             .sort({ epoch: -1 });
};

OrbitDataSchema.statics.latestTLE = function (objectId) {
  return this.findOne({ objectId, kind: 'tle', isActive: true })
             .sort({ epoch: -1 });
};

OrbitDataSchema.statics.windowForObject = function (objectId, start, end, kinds = ['state','propagated']) {
  return this.find({
    objectId,
    kind: { $in: kinds },
    epoch: { $gte: start, $lte: end },
    isActive: true
  }).sort({ epoch: 1 });
};

/* ---------------------- Export ---------------------- */

module.exports = mongoose.model('OrbitData', OrbitDataSchema);
