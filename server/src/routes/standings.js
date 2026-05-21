const { Router } = require('express');
const controller = require('../controllers/standingController');
const { validateQuery } = require('../middleware/validate');
const { standingQuerySchema } = require('../validators/standingSchema');

const router = Router();

router.get('/', validateQuery(standingQuerySchema), controller.getAll);

module.exports = router;
