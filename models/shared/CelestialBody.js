// models/shared/CelestialBody.js
const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const PhysicalPropertiesSchema = new mongoose.Schema({
  mass: { type: Number, required: true, min: [0, 'Mass cannot be negative'] }, // kg
  radius: { type: Number, required: true, min: [0, 'Radius cannot be negative'] }, // km
  gravity: { type: Number, required: true, min: [0, 'Gravity cannot be negative'] }, // m/s²
  escapeVelocity: { type: Number, required: true, min: [0, 'Escape velocity cannot be negative'] }, // km/s
  rotationPeriod: { type: Number, required: true, min: [0, 'Rotation period cannot be negative'] }, // hours
  orbitalPeriod: { type: Number, required: true, min: [0, 'Orbital period cannot be negative'] }, // days
  axialTilt: { type: Number, min: [0, 'Axial tilt cannot be negative'], max: [180, 'Axial tilt cannot exceed 180°'] },
  density: { type: Number, min: [0, 'Density cannot be negative'] }, // g/cm³
  albedo: { type: Number, min: [0, 'Albedo cannot be negative'], max: [1, 'Albedo cannot exceed 1'] } // reflectivity
}, { _id: false });

const AtmosphericSchema = new mongoose.Schema({
  hasAtmosphere: { type: Boolean, required: true, default: false },
  composition: { type: Map, of: Number }, // gas composition %
  pressure: { type: Number, min: [0, 'Pressure cannot be negative'] }, // kPa
  density: { type: Number, min: [0, 'Density cannot be negative'] }, // kg/m³
  scaleHeight: { type: Number, min: [0, 'Scale height cannot be negative'] }, // km
  temperature: {
    surface: Number // °C
  }
}, { _id: false });

const OrbitalSchema = new mongoose.Schema({
  semiMajorAxis: { type: Number, required: true, min: [0, 'Semi-major axis cannot be negative'] }, // km
  eccentricity: { type: Number, required: true, min: [0, 'Eccentricity cannot be negative'], max: [1, 'Eccentricity cannot exceed 1'] },
  inclination: { type: Number, required: true, min: [0, 'Inclination cannot be negative'], max: [180, 'Inclination cannot exceed 180°'] },
  ascendingNode: { type: Number, min: [0, 'Ascending node cannot be negative'], max: [360, 'Ascending node cannot exceed 360°'] },
  periapsis: { type: Number, min: [0, 'Periapsis cannot be negative'] }, // km
  apoapsis: { type: Number, min: [0, 'Apoapsis cannot be negative'] }, // km
  epoch: { type: Date, default: Date.now }
}, { _id: false });

const SurfaceSchema = new mongoose.Schema({
  terrainTypes: [{
    type: String,
    enum: [
      'mountains', 'plains', 'craters', 'valleys', 'canyons',
      'volcanoes', 'ice-caps', 'oceans', 'deserts'
    ]
  }],
  averageTemp: { type: Number, required: true }, // °C
  minTemp: Number,
  maxTemp: Number,
  magneticField: {
    hasField: { type: Boolean, default: false }
  },
  radiationLevel: { type: Number, min: [0, 'Radiation level cannot be negative'] }, // sieverts/day
  waterContent: { type: Number, min: [0, 'Water content cannot be negative'], max: [100, 'Water content cannot exceed 100%'] } // %
}, { _id: false });

const LandingSiteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  coordinates: {
    lat: { type: Number, required: true, min: [-90, 'Latitude cannot be less than -90'], max: [90, 'Latitude cannot exceed 90'] },
    lng: { type: Number, required: true, min: [-180, 'Longitude cannot be less than -180'], max: [180, 'Longitude cannot exceed 180'] }
  },
  safetyScore: { type: Number, required: true, min: [0, 'Safety score cannot be negative'], max: [100, 'Safety score cannot exceed 100'] },
  scientificValue: { type: Number, required: true, min: [0, 'Scientific value cannot be negative'], max: [100, 'Scientific value cannot exceed 100'] }
}, { _id: false });

const LandingDataSchema = new mongoose.Schema({
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'extreme'], required: true },
  hazardLevel: { type: Number, required: true, min: [1, 'Hazard level cannot be less than 1'], max: [10, 'Hazard level cannot exceed 10'] },
  recommendedLandingSites: [LandingSiteSchema],
  deltaVRequirements: {
    orbitInsertion: Number, // m/s
    landing: Number, // m/s
    takeoff: Number // m/s
  }
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  surface: String,
  fullDisk: String,
  topographic: String
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const CelestialBodySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Celestial body name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  type: {
    type: String,
    enum: ['planet', 'moon', 'dwarf-planet', 'star', 'asteroid', 'comet'],
    required: true
  },
  parentBody: { type: mongoose.Schema.Types.ObjectId, ref: 'CelestialBody' },
  discovery: {
    discoveredBy: String,
    discoveryYear: Number
  },
  physicalProperties: { type: PhysicalPropertiesSchema, required: true },
  atmospheric: { type: AtmosphericSchema, default: () => ({}) },
  orbital: { type: OrbitalSchema, required: true },
  surface: { type: SurfaceSchema, required: true },
  landingData: { type: LandingDataSchema, required: true },
  images: { type: ImageSchema, default: () => ({}) },
  description: { type: String, maxlength: [2000, 'Description cannot exceed 2000 characters'] },
  educational: {
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
    keyConcepts: [String]
  },
  tags: [String],
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */
CelestialBodySchema.index({ name: 1 }, { unique: true });
CelestialBodySchema.index({ type: 1 });
CelestialBodySchema.index({ 'physicalProperties.gravity': 1 });
CelestialBodySchema.index({ 'landingData.difficulty': 1 });
CelestialBodySchema.index({ isActive: 1 });

/* ---------------------- Static Query Helpers ---------------------- */

CelestialBodySchema.statics.findByType = function (type) {
  return this.find({ type, isActive: true }).sort({ name: 1 });
};

CelestialBodySchema.statics.findWithAtmosphere = function () {
  return this.find({
    'atmospheric.hasAtmosphere': true,
    isActive: true
  });
};

CelestialBodySchema.statics.findPlanets = function () {
  return this.find({
    type: 'planet',
    isActive: true
  });
};

/* ---------------------- Export ---------------------- */

const CelestialBody = mongoose.model('CelestialBody', CelestialBodySchema);
module.exports = CelestialBody;
