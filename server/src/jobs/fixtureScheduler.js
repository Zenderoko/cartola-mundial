const cron = require('node-cron');
const fixtureSyncService = require('../services/fixtureSyncService');
const { logger } = require('../utils/logger');

class FixtureScheduler {
  start() {
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Cron: checking for live fixture updates...');
      try {
        await fixtureSyncService.checkForLiveUpdates();
      } catch (err) {
        logger.error({ err }, 'Live fixture update check failed');
      }
    });

    cron.schedule('0 6 * * *', async () => {
      logger.info('Cron: daily full fixture sync...');
      try {
        await fixtureSyncService.syncAll();
      } catch (err) {
        logger.error({ err }, 'Daily fixture sync failed');
      }
    });

    logger.info('Fixture scheduler started');
  }
}

module.exports = new FixtureScheduler();
