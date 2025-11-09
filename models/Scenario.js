const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  mission: String,
  grade: { type: Number, required: true },
  curriculumCode: String,
  studentId: { type: String, required: true }, // Using string for now since we're using string IDs
  activities: [{
    title: String,
    instructions: String,
    materials: [String],
    expectedOutcome: String
  }],
  environmentalImpact: String,
  simulatorData: {
    emissionCalculator: Object,
    orbitVisualizer: Object
  },
  simulatorResults: Object,
  learningOutcomes: [String],
  aiGenerated: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// FIX: Use scenarioSchema (not scenarioModel)
module.exports = mongoose.model('Scenario', scenarioSchema);