const { Router } = require('express');
const controller = require('../controllers/syncController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { syncLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(syncLimiter);
router.use(requireAuth, requireAdmin);

router.post('/teams', controller.syncTeams);
router.post('/fixtures', controller.syncFixtures);
router.post('/standings', controller.syncStandings);
router.post('/squads', controller.syncSquads);
router.post('/match/:fixtureId', controller.syncMatch);
router.post('/points/:fixtureId', controller.syncPoints);
router.post('/rankings', controller.syncRankings);
router.post('/pre-seed', controller.syncPreSeed);

module.exports = router;
