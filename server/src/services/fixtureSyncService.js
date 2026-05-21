const apiFootball = require('./apiFootball');
const fixtureRepo = require('../repositories/fixtureRepo');
const fantasyEngine = require('./fantasyEngine');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const LEAGUE_ID = 1;
const SEASON = 2022;

class FixtureSyncService {
  async syncAll() {
    logger.info('Syncing all fixtures from API-Football...');
    const { data } = await apiFootball.getFixtures({ league: LEAGUE_ID, season: SEASON });
    const fixtures = data.response || [];
    const result = await fixtureRepo.upsertMany(fixtures);
    await this._logSync('fixtures', 'synced', result.total || fixtures.length);
    logger.info({ ...result }, 'Fixtures sync completed');
    return { ...result, total: fixtures.length };
  }

  async syncByRound(round) {
    logger.info({ round }, 'Syncing fixtures by round...');
    const { data } = await apiFootball.getFixturesByRound(round);
    const fixtures = data.response || [];
    const result = await fixtureRepo.upsertMany(fixtures);
    await this._logSync(`fixtures:round:${round}`, 'synced', result.total || fixtures.length);
    logger.info({ round, ...result }, 'Round sync completed');
    return { round, ...result, total: fixtures.length };
  }

  async syncSingle(id) {
    logger.info({ fixtureId: id }, 'Syncing single fixture...');
    const { data } = await apiFootball.getFixtureById(id);
    const fixture = data.response?.[0];
    if (!fixture) throw new Error(`Fixture ${id} not found in API-Football`);
    const result = await fixtureRepo.upsert(fixture);
    await this._logSync(`fixture:${id}`, 'synced', 1);
    return result;
  }

  async checkForLiveUpdates() {
    const result = await pool.query(`
      SELECT id, date FROM fixtures
      WHERE date BETWEEN NOW() - INTERVAL '4 hours' AND NOW() + INTERVAL '10 minutes'
        AND status NOT IN ('match finished', 'cancelled', 'postponed')
    `);

    let synced = 0;
    let finished = 0;

    for (const row of result.rows) {
      try {
        const { data } = await apiFootball.getFixtureById(row.id);
        const apiFixture = data.response?.[0];
        if (!apiFixture) continue;

        const apiStatus = apiFixture.fixture.status?.short;
        await fixtureRepo.upsert(apiFixture);

        if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
          logger.info({ fixtureId: row.id }, 'Fixture finished, syncing details + fantasy points');
          const syncService = require('./syncService');
          await syncService.syncMatchDetails(row.id);
          await fantasyEngine.calculatePoints(row.id);
          finished++;
        }
        synced++;
      } catch (err) {
        logger.error({ fixtureId: row.id, err: err.message }, 'Live sync failed');
      }
    }

    if (synced > 0) {
      logger.info({ checked: result.rows.length, synced, finished }, 'Live update check completed');
    }
    return { checked: result.rows.length, synced, finished };
  }

  async _logSync(entity, status, count) {
    try {
      await pool.query(
        `INSERT INTO sync_log (entity, status, rows_inserted, meta, synced_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [entity, status, count || 0, JSON.stringify({ timestamp: new Date().toISOString() })]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to log sync');
    }
  }
}

module.exports = new FixtureSyncService();
