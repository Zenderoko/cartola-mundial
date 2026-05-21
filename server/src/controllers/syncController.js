const syncService = require('../services/syncService');
const fantasyEngine = require('../services/fantasyEngine');
const rankingService = require('../services/rankingService');
const { success, error } = require('../utils/response');

async function syncTeams(req, res, next) {
  try {
    const result = await syncService.syncAllTeams();
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncFixtures(req, res, next) {
  try {
    const result = await syncService.syncAllFixtures();
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncStandings(req, res, next) {
  try {
    const result = await syncService.syncStandings();
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncSquads(req, res, next) {
  try {
    const result = await syncService.syncAllSquads();
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncMatch(req, res, next) {
  try {
    const { fixtureId } = req.params;
    const result = await syncService.syncMatchDetails(Number(fixtureId));
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncPoints(req, res, next) {
  try {
    const { fixtureId } = req.params;
    const result = await fantasyEngine.calculatePoints(Number(fixtureId));
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncRankings(req, res, next) {
  try {
    const result = await rankingService.refreshAll();
    return success(res, result);
  } catch (err) { next(err); }
}

async function syncPreSeed(req, res, next) {
  try {
    const result = await syncService.syncPreSeed();
    return success(res, result);
  } catch (err) { next(err); }
}

module.exports = { syncTeams, syncFixtures, syncStandings, syncSquads, syncMatch, syncPoints, syncRankings, syncPreSeed };
