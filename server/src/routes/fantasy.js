const { Router } = require('express');
const controller = require('../controllers/fantasyController');
const { validateBody, validateQuery } = require('../middleware/validate');
const { createTeamSchema, updateTeamSchema } = require('../validators/fantasySchema');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = Router();

router.get('/team', optionalAuth, controller.getMyTeam);
router.post('/team', requireAuth, validateBody(createTeamSchema), controller.createTeam);
router.put('/team/:id', requireAuth, validateBody(updateTeamSchema), controller.updateTeam);
router.get('/team/:id/points', requireAuth, controller.getPointsBreakdown);
router.delete('/team/:id/pick/:playerId', requireAuth, controller.removePick);

router.get('/prices', controller.getPrices);
router.get('/budget', controller.getBudgetRules);

module.exports = router;
