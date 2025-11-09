
const express = require('express');
const router = express.Router();
const controller = require('../controllers/emissionController');

router.get('/reference', controller.listReferenceData);
router.post('/estimate', controller.estimateEmissions);
router.post('/brief', controller.aiMissionBrief);
router.post('/risk', controller.riskReport);

module.exports = router;
