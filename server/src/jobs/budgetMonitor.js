const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const DAILY_BUDGET = 100;
const WARNING_THRESHOLD = 80;

class BudgetMonitor {
  async checkBudget() {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM request_log WHERE date = CURRENT_DATE'
      );
      const used = parseInt(result.rows[0].count);
      const remaining = DAILY_BUDGET - used;

      logger.info({ used, remaining, budget: DAILY_BUDGET }, 'API-Football budget status');

      if (remaining <= 10) {
        logger.error({ used, remaining }, 'CRITICAL: API-Football budget almost exhausted');
      } else if (remaining <= 20) {
        logger.warn({ used, remaining }, 'LOW: API-Football budget running low');
      }

      return { used, remaining };
    } catch (err) {
      logger.error({ err }, 'Failed to check API budget');
      return { used: -1, remaining: -1 };
    }
  }

  async getUsageReport() {
    const result = await pool.query(`
      SELECT date, COUNT(*) as requests,
        COUNT(*) FILTER (WHERE status >= 400) as errors,
        COUNT(DISTINCT endpoint) as unique_endpoints
      FROM request_log
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date ORDER BY date DESC
    `);
    return result.rows;
  }
}

module.exports = new BudgetMonitor();
