const fixtureRepo = require('../repositories/fixtureRepo');
const cacheService = require('./cacheService');

class FixtureService {
  async list(query) {
    const result = await fixtureRepo.findAll({
      page: query.page,
      perPage: query.per_page,
      date: query.date,
      team_id: query.team_id,
      round: query.round,
      status: query.status,
      stage: query.stage,
      search: query.search,
      sort: query.sort,
    });

    return {
      fixtures: result.rows,
      meta: {
        page: query.page,
        per_page: query.per_page,
        total: result.total,
        total_pages: Math.ceil(result.total / query.per_page),
      },
    };
  }

  async getById(id) {
    const fixture = await fixtureRepo.findById(id);
    if (!fixture) return null;

    const [fixtureStats, playerStats, fixtureEvents] = await Promise.all([
      fixtureRepo.getFixtureStats(id),
      fixtureRepo.getPlayerStats(id, 30),
      fixtureRepo.getFixtureEvents(id),
    ]);

    const fresh = await cacheService.isFixtureFresh(id);

    return {
      ...fixture,
      stats: fixtureStats,
      player_stats: playerStats,
      events: fixtureEvents,
      _cache: { fresh },
    };
  }

  async getLive() {
    const [liveFixtures, recentFinished] = await Promise.all([
      fixtureRepo.findLive(),
      fixtureRepo.findRecentFinished(3),
    ]);

    return {
      live: liveFixtures,
      recent: recentFinished,
      updated_at: new Date().toISOString(),
      live_count: liveFixtures.length,
      recent_count: recentFinished.length,
    };
  }

  async getRounds() {
    return fixtureRepo.getDistinctRounds();
  }

  async getDailyCount(date) {
    return fixtureRepo.getDailyFixtureCount(date);
  }
}

module.exports = new FixtureService();
