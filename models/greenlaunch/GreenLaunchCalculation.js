// models/greenlaunch/GreenLaunchCalculation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ---------------------- Subschemas ---------------------- */

const EmissionBreakdownSchema = new Schema({
  co2: {
    value: { type: Number, required: true }, // kg
    equivalentCars: Number,       // car-years
    equivalentHomes: Number,      // homes electricity annual
    treesRequired: Number         // trees to offset
  },
  nox: {
    value: Number,                // kg
    ozoneImpact: { type: Number, min: 0, max: 100 } // 0-100
  },
  blackCarbon: {
    value: Number,                // kg
    albedoEffect: Number          // warming potential (unitless)
  },
  waterVapor: {
    value: Number,                // kg
    cloudFormation: Number        // impact scale
  },
  otherEmissions: {
    type: Map,
    of: Number                    // future expansion (kg)
  }
}, { _id: false });

const ImpactScoreSchema = new Schema({
  sustainability: {
    score: { type: Number, min: 0, max: 100, required: true },
    category: {
      type: String,
      enum: ['excellent', 'good', 'moderate', 'poor', 'critical'],
      required: true
    },
    factors: [{
      name: String,
      value: Number,
      weight: Number
    }]
  },
  airQuality: {
    score: { type: Number, min: 0, max: 100 },
    localImpact: { type: Number, min: 0, max: 100 },
    regionalImpact: { type: Number, min: 0, max: 100 },
    duration: { type: Number, min: 0 } // hours
  },
  ozoneDepletion: {
    score: { type: Number, min: 0, max: 100 },
    potential: { type: Number, min: 0 }, // ODP-scale
    recoveryTime: { type: Number, min: 0 } // years
  },
  globalWarming: {
    score: { type: Number, min: 0, max: 100 },
    co2Equivalent: { type: Number, min: 0 }, // kg CO2e
    gwp100: { type: Number, min: 0 }         // GWP100
  },
  overall: {
    score: { type: Number, min: 0, max: 100 },   // optional; compute in service
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'] }
  }
}, { _id: false });

const OptimizationSuggestionSchema = new Schema({
  type: {
    type: String,
    enum: [
      'fuel-change',
      'trajectory-optimization',
      'payload-optimization',
      'launch-site-change',
      'vehicle-selection',
      'mission-profile'
    ],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  currentValue: Schema.Types.Mixed,
  suggestedValue: Schema.Types.Mixed,
  improvement: {
    emissionReduction: { type: Number, min: 0 }, // %
    costSavings: { type: Number, min: 0 },       // % or absolute
    scoreImprovement: Number,                    // points
    sustainabilityGain: { type: Number, min: 0 } // %
  },
  feasibility: {
    level: { type: String, enum: ['high', 'medium', 'low'] },
    cost: { type: Number, min: 0 },
    time: { type: Number, min: 0 },              // days
    technicalDifficulty: { type: Number, min: 1, max: 10 }
  },
  impact: {
    environmental: { type: Number, min: 0, max: 10 },
    economic: { type: Number, min: 0, max: 10 },
    operational: { type: Number, min: 0, max: 10 }
  }
}, { _id: false });

const ComparisonDataSchema = new Schema({
  industryAverage: {
    emissions: {
      co2: Number,
      nox: Number,
      sustainability: Number
    },
    source: String,
    lastUpdated: Date
  },
  similarMissions: [{
    missionId: { type: Schema.Types.ObjectId, ref: 'GreenLaunchMission' },
    name: String,
    emissions: Number,
    score: Number,
    improvement: Number // %
  }],
  historicalTrend: {
    year: Number,
    averageEmission: Number,
    improvement: Number // % vs previous year
  }
}, { _id: false });

const CostAnalysisSchema = new Schema({
  launchCost: {
    total: { type: Number, min: 0 },      // USD
    perKg: { type: Number, min: 0 },
    breakdown: {
      vehicle: { type: Number, min: 0 },
      fuel: { type: Number, min: 0 },
      operations: { type: Number, min: 0 },
      insurance: { type: Number, min: 0 }
    }
  },
  environmentalCost: {
    carbonOffset: { type: Number, min: 0 },
    cleanup: { type: Number, min: 0 },
    healthImpact: { type: Number, min: 0 },
    totalExternalities: { type: Number, min: 0 }
  },
  optimizationSavings: {
    potential: { type: Number, min: 0 },  // USD
    paybackPeriod: { type: Number, min: 0 }, // months
    roi: Number                           // %
  }
}, { _id: false });

/* ---------------------- Main Schema ---------------------- */

const GreenLaunchCalculationSchema = new Schema({
  missionId: {
    type: Schema.Types.ObjectId,
    ref: 'GreenLaunchMission',
    required: true,
    index: true
  },

  calculationVersion: { type: String, required: true, default: '1.0' },
  algorithmUsed:    { type: String, required: true, default: 'standard-v1' },

  dataSources: [{
    name: String,
    version: String,
    reliability: { type: Number, min: 0, max: 1 } // 0–1
  }],

  emissions: { type: EmissionBreakdownSchema, required: true },

  impactScores: { type: ImpactScoreSchema, required: true },

  optimization: {
    suggestions: [OptimizationSuggestionSchema],
    bestSuggestion: OptimizationSuggestionSchema,
    overallImprovement: {
      emissionReduction: Number,
      costReduction: Number,
      scoreImprovement: Number
    }
  },

  comparison: { type: ComparisonDataSchema, required: true },

  costAnalysis: { type: CostAnalysisSchema, required: true },

  efficiency: {
    payloadRatio: { type: Number, min: 0 },     // payload / total mass
    fuelEfficiency: { type: Number, min: 0 },   // kg payload per kg fuel
    energyEfficiency: { type: Number, min: 0 }, // MJ per kg payload
    costEfficiency: { type: Number, min: 0 }    // USD per kg
  },

  compliance: {
    faa: {
      compliant: { type: Boolean, default: false },
      requirements: [String],
      violations: [String],
      score: Number
    },
    environmental: {
      compliant: { type: Boolean, default: false },
      standards: [String],
      exceedances: [String],
      penalties: { type: Number, min: 0 }
    },
    international: {
      compliant: { type: Boolean, default: false },
      treaties: [String],
      issues: [String]
    }
  },

  simulation: {
    runTime: { type: Number, min: 0 }, // ms
    convergence: { type: Boolean, default: true },
    iterations: { type: Number, min: 0 },
    accuracy: { type: Number, min: 0, max: 1 }, // 0–1
    assumptions: [String]
  },

  cache: {
    hash: { type: String, index: true },
    expiresAt: Date,
    hitCount: { type: Number, default: 0, min: 0 }
  },

  // Renamed to avoid confusion with Mongoose timestamps
  calcTimestamps: {
    calculatedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },

  status: {
    type: String,
    enum: ['calculated', 'optimized', 'outdated', 'error'],
    default: 'calculated',
    index: true
  },

  error: {
    occurred: { type: Boolean, default: false },
    message: String,
    stackTrace: String,
    retryCount: { type: Number, min: 0 }
  },

  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,                 // createdAt / updatedAt (Mongoose)
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'greenlaunch_calculations'
});

/* ---------------------- Virtuals ---------------------- */

GreenLaunchCalculationSchema.virtual('mission', {
  ref: 'GreenLaunchMission',
  localField: 'missionId',
  foreignField: '_id',
  justOne: true
});

/* ---------------------- Indexes ---------------------- */

GreenLaunchCalculationSchema.index({ missionId: 1, 'calcTimestamps.calculatedAt': -1 });
GreenLaunchCalculationSchema.index({ 'cache.hash': 1 });
GreenLaunchCalculationSchema.index({ 'impactScores.sustainability.score': -1 });
GreenLaunchCalculationSchema.index({ 'emissions.co2.value': 1 });
GreenLaunchCalculationSchema.index(
  { 'calcTimestamps.calculatedAt': 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 } // ~30 days TTL (auto purge)
);

/* ---------------------- Static Query Helpers ---------------------- */

GreenLaunchCalculationSchema.statics.findByMissionId = function (missionId) {
  return this.find({ missionId, isActive: true })
    .sort({ 'calcTimestamps.calculatedAt': -1 });
};

GreenLaunchCalculationSchema.statics.findTopPerformers = function (limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'impactScores.sustainability.score': -1 })
    .limit(limit);
};

GreenLaunchCalculationSchema.statics.getIndustryStats = function () {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        avgSustainability: { $avg: '$impactScores.sustainability.score' },
        avgCO2: { $avg: '$emissions.co2.value' },
        totalCalculations: { $sum: 1 },
        bestScore: { $max: '$impactScores.sustainability.score' },
        worstScore: { $min: '$impactScores.sustainability.score' }
      }
    }
  ]);
};

/* ---------------------- Instance Helpers (lightweight) ---------------------- */

GreenLaunchCalculationSchema.methods.getOptimizationSummary = function () {
  const suggestions = this.optimization?.suggestions || [];
  const feasibility = suggestions.reduce((acc, s) => {
    const lvl = s?.feasibility?.level || 'unknown';
    acc[lvl] = (acc[lvl] || 0) + 1;
    return acc;
  }, {});
  return {
    totalSuggestions: suggestions.length,
    bestImprovement: this.optimization?.overallImprovement || null,
    topSuggestion: this.optimization?.bestSuggestion || null,
    feasibility
  };
};

GreenLaunchCalculationSchema.methods.isCompliant = function () {
  const c = this.compliance || {};
  return Boolean(c.faa?.compliant && c.environmental?.compliant && c.international?.compliant);
};

GreenLaunchCalculationSchema.methods.getCostBenefitAnalysis = function () {
  const envCost = this.costAnalysis?.environmentalCost?.totalExternalities || 0;
  const potential = this.costAnalysis?.optimizationSavings?.potential || 0;
  return {
    netEnvironmentalImpact: envCost - potential,
    costBenefitRatio: envCost ? potential / envCost : null,
    recommendation: potential > envCost ? 'Implement optimizations' : 'Review mission parameters'
  };
};

module.exports = mongoose.model('GreenLaunchCalculation', GreenLaunchCalculationSchema);
