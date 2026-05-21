const { Router } = require('express');
const controller = require('../controllers/fixtureController');
const { validateQuery, validateParams } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generalLimiter, syncLimiter } = require('../middleware/rateLimiter');
const { fixtureQuerySchema, fixtureParamsSchema } = require('../validators/fixtureSchema');

const router = Router();

router.get('/', generalLimiter, validateQuery(fixtureQuerySchema), controller.getAll);
router.get('/live', generalLimiter, controller.getLive);
router.get('/rounds', generalLimiter, controller.getRounds);
router.get('/daily-count', generalLimiter, controller.getDailyCount);
router.get('/:id', generalLimiter, validateParams(fixtureParamsSchema), controller.getById);
router.get('/:id/players', generalLimiter, validateParams(fixtureParamsSchema), controller.getPlayerStats);
router.get('/:id/stats', generalLimiter, validateParams(fixtureParamsSchema), controller.getFixtureStats);
router.get('/:id/events', generalLimiter, validateParams(fixtureParamsSchema), controller.getEvents);

router.post('/sync', requireAuth, requireAdmin, syncLimiter, controller.syncFixtures);
router.post('/sync/round/:round', requireAuth, requireAdmin, syncLimiter, controller.syncRound);
router.post('/check-live', requireAuth, requireAdmin, syncLimiter, controller.checkLive);

module.exports = router;
