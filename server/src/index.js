const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { env } = require('./config/env');
const { pool } = require('./config/database');
const { logger } = require('./utils/logger');
const syncScheduler = require('./jobs/syncScheduler');
const fixtureScheduler = require('./jobs/fixtureScheduler');

async function main() {
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.fatal({ err }, 'Database connection failed');
    process.exit(1);
  }

  syncScheduler.start();
  fixtureScheduler.start();

  app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
    logger.info(`Fixtures API: http://localhost:${env.PORT}/api/fixtures`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
