// models/shared/LaunchSite.js
const mongoose = require('mongoose');

/* ---------------------- Subschemas ---------------------- */

const CoordinatesSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude cannot be less than -90'],
    max: [90, 'Latitude cannot exceed 90']
  },
  lng: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude cannot be less than -180'],
    max: [180, 'Longitude cannot exceed 180']
  },
  altitude: {
    type: Number,
    min: [0, 'Altitude cannot be negative'],
    default: 0
  },
  utcOffset: Number,
  timezone: String
}, { _id: false }); // prevents nested _id objects

const LaunchPadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
  lastLaunch: Date,
  nextLaunch: Date,
  constructionYear: Number,
  specifications: {
    azimuthRange: {
      min: Number,
      max: Number
    }
  },
  supportedRockets: [{
    rocketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rocket' },
    rocketName: String
  }]
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const LaunchSiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Launch site name is required'],
    trim: true,
    unique: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  operator: {
    type: String,
    required: [true, 'Operator is required'],
    trim: true
  },
  coordinates: {
    type: CoordinatesSchema,
    required: true
  },
  capabilities: {
    supportedOrbits: [String],
    launchPads: [LaunchPadSchema]
  },
  efficiency: {
    equatorialBonus: Number,
    inclinationRange: {
      min: Number,
      max: Number
    },
    weatherDays: Number // number of clear launch days per year
  },
  environmental: {
    populationDensity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    ecologicalSensitivity: {
      type: Number,
      min: [0, 'Sensitivity cannot be negative'],
      max: [100, 'Sensitivity cannot exceed 100']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'development', 'decommissioned'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

/* ---------------------- Indexes ---------------------- */

LaunchSiteSchema.index({ name: 1 }, { unique: true });
LaunchSiteSchema.index({ country: 1 });
LaunchSiteSchema.index({ status: 1 });
LaunchSiteSchema.index({ isActive: 1 });

/* ---------------------- Static Query Helpers ---------------------- */

// Find all active launch sites
LaunchSiteSchema.statics.findActiveSites = function () {
  return this.find({ status: 'active', isActive: true }).sort({ name: 1 });
};

// Find active launch sites by country
LaunchSiteSchema.statics.findByCountry = function (country) {
  return this.find({ country, status: 'active', isActive: true }).sort({ name: 1 });
};

/* ---------------------- Export ---------------------- */

const LaunchSite = mongoose.model('LaunchSite', LaunchSiteSchema);
module.exports = LaunchSite;
