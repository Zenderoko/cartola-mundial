require('dotenv').config();
const { pool } = require('../src/config/database');
const syncService = require('../src/services/syncService');
const { logger } = require('../src/utils/logger');

async function main() {
  logger.info('Script: syncing standings...');
  try {
    const result = await syncService.syncStandings();
    logger.info({ result }, 'Standings synced');
  } catch (err) {
    logger.error({ err }, 'Failed to sync standings');
  }
  await pool.end();
}

main();
