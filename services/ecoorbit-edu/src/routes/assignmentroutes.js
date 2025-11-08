const router = require('express').Router();
const ctrl = require('../controllers/assignmentcontrollers');

router.post('/assignments', ctrl.create);
router.get('/classes/:classId/assignments', ctrl.listByClass);
router.post('/assignments/submit', ctrl.submit);
router.post('/assignments/grade', ctrl.grade);

module.exports = router;
