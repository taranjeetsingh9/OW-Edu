// models/orbitwatch/ConjunctionEvent.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const GeometrySchema = new Schema({
  approachAngle: { type: Number, min: 0, max: 360 }, // degrees
  radialDistance: { type: Number, min: 0 },          // km
  inTrackDistance: { type: Number, min: 0 },         // km
  crossTrackDistance: { type: Number, min: 0 }       // km
}, { _id: false });

const ManeuverSchema = new Schema({
  type: { type: String, trim: true },                // e.g., "in-track", "radial", "cross-track"
  deltaV: { type: Number, min: 0 },                  // m/s (recommend keeping m/s)
  timeBefore: { type: Number, min: 0 }               // hours before event
}, { _id: false });

const MitigationSchema = new Schema({
  suggested: { type: Boolean, default: false },
  maneuvers: [ManeuverSchema],
  cost: { type: Number, min: 0 }                     // USD (optional)
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const ConjunctionEventSchema = new Schema({
  objectA: { type: Schema.Types.ObjectId, ref: 'SpaceObject', required: true, index: true },
  objectB: { type: Schema.Types.ObjectId, ref: 'SpaceObject', required: true, index: true },

  eventTime: { type: Date, required: true, index: true },

  missDistance: { type: Number, required: true, min: 0 },    // km
  relativeVelocity: { type: Number, required: true, min: 0 },// km/s
  probability: { type: Number, required: true, min: 0, max: 1, index: true },

  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },

  geometry: { type: GeometrySchema, default: () => ({}) },

  mitigation: { type: MitigationSchema, default: () => ({}) },

  status: {
    type: String,
    enum: ['predicted', 'occurred', 'missed', 'mitigated'],
    default: 'predicted',
    index: true
  },

  // operational flags
  isActive: { type: Boolean, default: true, index: true },

  // separate block to avoid confusion with Mongoose timestamps
  eventTimestamps: {
    detectedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true, // createdAt / updatedAt
  collection: 'orbitwatch_conjunctions'
});

/* ---------------------- Indexes ---------------------- */

// Pair & time (supports de-dup and fast lookups)
ConjunctionEventSchema.index({ objectA: 1, objectB: 1, eventTime: 1 });
// Sort by severity for alerting dashboards
ConjunctionEventSchema.index({ riskLevel: 1, probability: -1, missDistance: 1 });
// Quick filter by status and time window
ConjunctionEventSchema.index({ status: 1, eventTime: 1 });

/* ---------------------- Data Hygiene (light) ---------------------- */
/**
 * Normalize the pair order (objectA < objectB) to reduce duplicates like (A,B) vs (B,A).
 * This is a small data-integrity helper; keep heavier logic in services.
 */
ConjunctionEventSchema.pre('validate', function normalizePair(next) {
  if (this.objectA && this.objectB && this.objectA.toString() > this.objectB.toString()) {
    const tmp = this.objectA;
    this.objectA = this.objectB;
    this.objectB = tmp;
  }
  next();
});

/* ---------------------- Export ---------------------- */
module.exports = mongoose.model('ConjunctionEvent', ConjunctionEventSchema);
