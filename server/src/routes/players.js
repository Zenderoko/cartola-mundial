const { Router } = require('express');
const controller = require('../controllers/playerController');
const { validateQuery, validateParams } = require('../middleware/validate');
const { playerQuerySchema, playerParamsSchema, topPlayersQuerySchema } = require('../validators/playerSchema');

const router = Router();

router.get('/', validateQuery(playerQuerySchema), controller.getAll);
router.get('/top', validateQuery(topPlayersQuerySchema), controller.getTop);
router.get('/:id', validateParams(playerParamsSchema), controller.getById);

module.exports = router;
