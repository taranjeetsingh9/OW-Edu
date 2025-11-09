const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
  grade: { type: Number, required: true, min: 6, max: 12 },
  subject: { type: String, required: true },
  strand: String, 
  expectation: String, 
  topic: String, 
  spaceConnection: String, 
  difficulty: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' },
  activities: [{
    type: { type: String, enum: ['experiment', 'simulation', 'quiz', 'mission'] },
    title: String,
    description: String,
    materials: [String],
    learningOutcomes: [String]
  }],
  ontarioCode: String, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Curriculum', curriculumSchema);