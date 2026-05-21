const statsIntelligence = require('../services/statsIntelligence');
const { success, error } = require('../utils/response');

async function getTeamAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await statsIntelligence.getTeamAnalysis(Number(id));
    if (!analysis) return error(res, 404, 'NO_DATA', 'No match data available for this team');
    return success(res, analysis);
  } catch (err) { next(err); }
}

async function getPlayerAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await statsIntelligence.getPlayerAnalysis(Number(id));
    if (!analysis) return error(res, 404, 'NO_DATA', 'No match data available for this player');
    return success(res, analysis);
  } catch (err) { next(err); }
}

async function getMatchPrediction(req, res, next) {
  try {
    const { home, away } = req.query;
    if (!home || !away) return error(res, 400, 'MISSING_PARAMS', 'home and away team IDs required');
    const prediction = await statsIntelligence.getMatchPrediction(Number(home), Number(away));
    if (!prediction) return error(res, 404, 'NO_DATA', 'Could not generate prediction');
    return success(res, prediction);
  } catch (err) { next(err); }
}

async function getTopTeams(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const teams = await statsIntelligence.getTopTeamsByIndex(limit);
    return success(res, teams, { limit });
  } catch (err) { next(err); }
}

async function getTopPlayers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const position = req.query.position || null;
    const players = await statsIntelligence.getTopPlayersByScore(limit, position);
    return success(res, players, { limit, position: position || 'all' });
  } catch (err) { next(err); }
}

async function getTournamentSnapshot(req, res, next) {
  try {
    const snapshot = await statsIntelligence.getTournamentSnapshot();
    return success(res, snapshot);
  } catch (err) { next(err); }
}

module.exports = {
  getTeamAnalysis, getPlayerAnalysis, getMatchPrediction,
  getTopTeams, getTopPlayers, getTournamentSnapshot,
};
