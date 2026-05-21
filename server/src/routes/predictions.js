const { Router } = require('express');
const controller = require('../controllers/predictionController');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/markets', controller.getMarkets);
router.get('/matches', optionalAuth, controller.getUpcomingMatches);
router.get('/my', requireAuth, controller.getMyPredictions);
router.post('/', requireAuth, controller.createPrediction);
router.post('/settle/:fixtureId', requireAuth, requireAdmin, controller.settlePredictions);
router.get('/leaderboard', controller.getLeaderboard);

module.exports = router;
