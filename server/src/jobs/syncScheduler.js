const cron = require('node-cron');
const syncService = require('../services/syncService');
const fantasyEngine = require('../services/fantasyEngine');
const rankingService = require('../services/rankingService');
const budgetMonitor = require('./budgetMonitor');
const { logger } = require('../utils/logger');
const { pool } = require('../config/database');

class SyncScheduler {
  start() {
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Cron: checking for finished matches...');
      await this.checkFinishedMatches();
    });

    cron.schedule('0 6 * * *', async () => {
      logger.info('Cron: daily fixture sync...');
      try {
        await syncService.syncAllFixtures();
      } catch (err) {
        logger.error({ err }, 'Cron: daily fixture sync failed');
      }
    });

    cron.schedule('30 6 * * *', async () => {
      logger.info('Cron: daily budget check...');
      await budgetMonitor.checkBudget();
    });

    cron.schedule('0 22 * * *', async () => {
      logger.info('Cron: nightly standings + rankings + tops sync...');
      try {
        await syncService.syncStandings();
        await syncService.syncTopScorers();
        await syncService.syncTopAssists();
        await rankingService.refreshAll();
      } catch (err) {
        logger.error({ err }, 'Cron: nightly sync failed');
      }
    });

    logger.info('Sync scheduler started');
  }

  async checkFinishedMatches() {
    try {
      const result = await pool.query(`
        SELECT id FROM fixtures
        WHERE status = 'scheduled' AND date <= NOW()
      `);

      for (const row of result.rows) {
        try {
          await syncService.syncMatchDetails(row.id);
          await fantasyEngine.calculatePoints(row.id);
          await pool.query(
            "UPDATE fixtures SET status = 'match finished', updated_at = NOW() WHERE id = $1",
            [row.id]
          );
          logger.info({ fixtureId: row.id }, 'Match completed and synced');
        } catch (err) {
          logger.error({ fixtureId: row.id, err: err.message }, 'Failed to sync match');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Failed to check finished matches');
    }
  }
}

module.exports = new SyncScheduler();
