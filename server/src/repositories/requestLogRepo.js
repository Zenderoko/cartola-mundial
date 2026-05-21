const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class RequestLogRepo {
  async log(endpoint, params, statusCode) {
    try {
      await pool.query(
        `INSERT INTO request_log (endpoint, params, status, date)
         VALUES ($1, $2, $3, CURRENT_DATE)`,
        [endpoint, JSON.stringify(params), statusCode]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to log request');
    }
  }

  async getTodayCount() {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM request_log WHERE date = CURRENT_DATE'
    );
    return parseInt(rows[0].count);
  }

  async getDailyStats(days = 7) {
    const { rows } = await pool.query(`
      SELECT date, COUNT(*) as requests,
        COUNT(*) FILTER (WHERE status >= 400) as errors
      FROM request_log
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY date ORDER BY date DESC
    `);
    return rows;
  }
}

module.exports = new RequestLogRepo();
