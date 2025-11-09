const router = require('express').Router();
const ctrl = require('../controllers/scenariocontrollers');

router.post('/scenarios/generate', ctrl.generateSpaceScenario);
router.get('/scenarios/my-scenarios', ctrl.getStudentScenarios);
router.post('/scenarios/submit-result', ctrl.submitScenarioResult);

module.exports = router;