require('dotenv').config();
const { pool } = require('../src/config/database');
const syncService = require('../src/services/syncService');
const { logger } = require('../src/utils/logger');

async function main() {
  logger.info('Script: syncing all squads...');
  try {
    const result = await syncService.syncAllSquads();
    logger.info({ result }, 'Squads synced');
  } catch (err) {
    logger.error({ err }, 'Failed to sync squads');
  }
  await pool.end();
}

main();
