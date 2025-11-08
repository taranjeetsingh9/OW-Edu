const router = require('express').Router();
const ctrl = require('../controllers/classcontrollers');

router.post('/classes', ctrl.createClass);
router.get('/classes', ctrl.listMyClasses);
router.get('/classes/:id', ctrl.getById);
router.post('/classes/join', ctrl.joinByCode);

module.exports = router;
