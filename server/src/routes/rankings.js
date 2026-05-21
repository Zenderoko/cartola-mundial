const { Router } = require('express');
const controller = require('../controllers/rankingController');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

router.get('/', controller.getGlobalRanking);
router.get('/rounds', controller.getRounds);
router.get('/round/:round', controller.getRoundRanking);
router.get('/my-position', optionalAuth, controller.getUserPosition);

module.exports = router;
