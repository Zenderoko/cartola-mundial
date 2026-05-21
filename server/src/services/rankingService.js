const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class RankingService {
  async refreshAll() {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global');
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_by_round');
      logger.info('Materialized views refreshed');
      return { global: true, by_round: true };
    } catch (err) {
      logger.warn({ err: err.message }, 'Could not refresh materialized views');
      return { global: false, by_round: false, error: err.message };
    }
  }

  async refreshGlobal() {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_global');
      return true;
    } catch { return false; }
  }

  async refreshByRound() {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_by_round');
      return true;
    } catch { return false; }
  }
}

module.exports = new RankingService();
