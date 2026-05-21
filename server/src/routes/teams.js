const { Router } = require('express');
const controller = require('../controllers/teamController');
const { validateQuery, validateParams } = require('../middleware/validate');
const { teamQuerySchema, teamParamsSchema } = require('../validators/teamSchema');

const router = Router();

router.get('/', validateQuery(teamQuerySchema), controller.getAll);
router.get('/:id', validateParams(teamParamsSchema), controller.getById);
router.get('/:id/stats', validateParams(teamParamsSchema), controller.getStats);

module.exports = router;
