require('dotenv').config();
const { pool } = require('../src/config/database');
const syncService = require('../src/services/syncService');
const { logger } = require('../src/utils/logger');

async function main() {
  logger.info('Script: syncing all fixtures...');
  try {
    const result = await syncService.syncAllFixtures();
    logger.info({ result }, 'Fixtures synced');
  } catch (err) {
    logger.error({ err }, 'Failed to sync fixtures');
  }
  await pool.end();
}

main();
