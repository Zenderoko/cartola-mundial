const { Router } = require('express');
const controller = require('../controllers/favoriteController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, controller.create);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
