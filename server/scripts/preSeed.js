require('dotenv').config();
const { pool } = require('../src/config/database');
const syncService = require('../src/services/syncService');
const { logger } = require('../src/utils/logger');

async function main() {
  logger.info('=== PRE-SEED SCRIPT START ===');
  try {
    const result = await syncService.syncPreSeed();
    logger.info({ result }, 'Pre-seed complete');
  } catch (err) {
    logger.error({ err }, 'Pre-seed failed');
  }
  await pool.end();
}

main();
