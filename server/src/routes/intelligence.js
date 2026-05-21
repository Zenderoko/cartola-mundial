const { Router } = require('express');
const controller = require('../controllers/intelligenceController');

const router = Router();

router.get('/teams/top', controller.getTopTeams);
router.get('/team/:id/analysis', controller.getTeamAnalysis);
router.get('/players/top', controller.getTopPlayers);
router.get('/player/:id/analysis', controller.getPlayerAnalysis);
router.get('/predictions', controller.getMatchPrediction);
router.get('/snapshot', controller.getTournamentSnapshot);

module.exports = router;
