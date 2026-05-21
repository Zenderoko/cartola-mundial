const { Router } = require('express');

const authRouter = require('./auth');
const fixturesRouter = require('./fixtures');
const teamsRouter = require('./teams');
const standingsRouter = require('./standings');
const playersRouter = require('./players');
const fantasyRouter = require('./fantasy');
const rankingsRouter = require('./rankings');
const favoritesRouter = require('./favorites');
const syncRouter = require('./sync');
const intelligenceRouter = require('./intelligence');
const predictionsRouter = require('./predictions');

const router = Router();

router.use('/auth', authRouter);
router.use('/fixtures', fixturesRouter);
router.use('/teams', teamsRouter);
router.use('/standings', standingsRouter);
router.use('/players', playersRouter);
router.use('/fantasy', fantasyRouter);
router.use('/rankings', rankingsRouter);
router.use('/favorites', favoritesRouter);
router.use('/sync', syncRouter);
router.use('/cartola', intelligenceRouter);
router.use('/predictions', predictionsRouter);

module.exports = router;
