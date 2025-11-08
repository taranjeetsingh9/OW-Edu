const router = require('express').Router();
const ctrl = require('../controllers/progresscontrollers');

router.get('/classes/:classId/my-progress', ctrl.getMyProgress);

module.exports = router;
