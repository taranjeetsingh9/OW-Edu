// src/controllers/emissionController.js
const {
    computeEmissionSummary,
    ROCKET_PROFILES,
    DESTINATION_FACTORS,
    ONTARIO_LAUNCH_SITES
  } = require('../utils/emissionCalculator');
  const { generateMissionBrief } = require('../services/greenLaunchAiService');
  
  async function estimateEmissions(req, res) {
    try {
      const payload = req.body || {};
      const summary = computeEmissionSummary(payload);
      res.json({ summary });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async function aiMissionBrief(req, res) {
    try {
      const payload = req.body || {};
      const report = await generateMissionBrief(payload);
      res.json(report);
    } catch (error) {
      const status = error.message.includes('GEMINI') ? 500 : 400;
      res.status(status).json({ error: error.message });
    }
  }
  
  function listReferenceData(_req, res) {
    res.json({
      rockets: ROCKET_PROFILES,
      destinations: DESTINATION_FACTORS,
      ontarioLaunchSites: ONTARIO_LAUNCH_SITES
    });
  }
  
  module.exports = {
    estimateEmissions,
    aiMissionBrief,
    listReferenceData
  };