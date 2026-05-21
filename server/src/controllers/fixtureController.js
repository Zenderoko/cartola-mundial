const fixtureService = require('../services/fixtureService');
const fixtureSyncService = require('../services/fixtureSyncService');
const fixtureRepo = require('../repositories/fixtureRepo');
const cacheService = require('../services/cacheService');
const { success, paginated, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const result = await fixtureService.list(req.query);
    return paginated(res, result.fixtures, result.meta);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const fixture = await fixtureService.getById(parseInt(req.params.id));
    if (!fixture) {
      return error(res, 404, 'FIXTURE_NOT_FOUND', 'Partido no encontrado');
    }
    return success(res, {
      ...fixture,
      _cache: undefined,
    }, {
      cache: {
        fresh: fixture._cache.fresh,
        synced_at: fixture.updated_at,
        expires_at: fixture.cache_until,
      },
    });
  } catch (err) { next(err); }
}

async function getLive(req, res, next) {
  try {
    const data = await fixtureService.getLive();
    return success(res, {
      live: data.live,
      recent: data.recent,
      updated_at: data.updated_at,
    }, { live_count: data.live_count, recent_count: data.recent_count });
  } catch (err) { next(err); }
}

async function getRounds(req, res, next) {
  try {
    const rounds = await fixtureService.getRounds();
    return success(res, rounds);
  } catch (err) { next(err); }
}

async function getDailyCount(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const count = await fixtureService.getDailyCount(date);
    return success(res, { date, fixture_count: count });
  } catch (err) { next(err); }
}

async function getPlayerStats(req, res, next) {
  try {
    const { id } = req.params;
    const fixture = await fixtureRepo.findById(id);
    if (!fixture) return error(res, 404, 'NOT_FOUND', `Fixture ${id} not found`);
    const data = await fixtureRepo.getPlayerStatsByFixture(id);
    return success(res, data, { fixture_id: Number(id) });
  } catch (err) { next(err); }
}

async function getFixtureStats(req, res, next) {
  try {
    const { id } = req.params;
    const data = await fixtureRepo.getFixtureStats(id);
    return success(res, data, { fixture_id: Number(id) });
  } catch (err) { next(err); }
}

async function getEvents(req, res, next) {
  try {
    const { id } = req.params;
    const fixture = await fixtureRepo.findById(id);
    if (!fixture) return error(res, 404, 'NOT_FOUND', `Fixture ${id} not found`);
    const [events, motm] = await Promise.all([
      fixtureRepo.getEventsByFixture(id),
      fixtureRepo.getManOfTheMatch(id),
    ]);
    return success(res, { events, man_of_the_match: motm }, { event_count: events.length });
  } catch (err) { next(err); }
}

async function syncFixtures(req, res, next) {
  try {
    const result = await fixtureSyncService.syncAll();
    return success(res, result, { synced_at: new Date().toISOString() });
  } catch (err) { next(err); }
}

async function syncRound(req, res, next) {
  try {
    const result = await fixtureSyncService.syncByRound(req.params.round);
    return success(res, result, { round: req.params.round, synced_at: new Date().toISOString() });
  } catch (err) { next(err); }
}

async function checkLive(req, res, next) {
  try {
    const result = await fixtureSyncService.checkForLiveUpdates();
    return success(res, result);
  } catch (err) { next(err); }
}

module.exports = {
  getAll, getById, getLive, getRounds, getDailyCount,
  getPlayerStats, getFixtureStats, getEvents,
  syncFixtures, syncRound, checkLive,
};
