const { pool } = require('../config/database');

class CacheService {
  async isEntityFresh(entity) {
    const result = await pool.query(
      `SELECT cache_until FROM sync_log
       WHERE entity = $1 AND status = 'synced'
       ORDER BY synced_at DESC LIMIT 1`,
      [entity]
    );
    if (!result.rows[0]?.cache_until) return false;
    return new Date(result.rows[0].cache_until) > new Date();
  }

  async isFixtureFresh(fixtureId) {
    const result = await pool.query(
      'SELECT cache_until, status FROM fixtures WHERE id = $1',
      [fixtureId]
    );
    if (!result.rows[0]) return false;

    const { cache_until, status } = result.rows[0];

    if (status === 'match finished') return true;
    if (status === 'cancelled' || status === 'postponed') return false;

    if (!cache_until) return false;
    return new Date(cache_until) > new Date();
  }

  async setFixtureCache(fixtureId, ttlHours = 6) {
    await pool.query(
      'UPDATE fixtures SET cache_until = NOW() + INTERVAL \'$1 hours\' WHERE id = $2',
      [ttlHours, fixtureId]
    );
  }

  async setEntityCache(entity, ttlHours = 6) {
    await pool.query(
      `UPDATE sync_log SET cache_until = NOW() + INTERVAL '${ttlHours} hours'
       WHERE entity = $1 AND status = 'synced'`,
      [entity]
    );
  }

  addCacheMeta(entity, syncedAt) {
    return {
      fresh: true,
      synced_at: syncedAt || new Date().toISOString(),
    };
  }
}

module.exports = new CacheService();
