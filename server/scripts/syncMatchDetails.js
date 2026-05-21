require('dotenv').config();
const { pool } = require('../src/config/database');
const syncService = require('../src/services/syncService');
const { logger } = require('../src/utils/logger');

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const maxFixtures = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

  if (maxFixtures) {
    logger.info({ maxFixtures }, `Starting match details sync (limited to ${maxFixtures} fixtures)...`);
  } else {
    logger.info('Starting match details sync for all fixtures...');
  }

  const query = maxFixtures
    ? {
        text: `SELECT f.id FROM fixtures f
               LEFT JOIN player_stats ps ON ps.fixture_id = f.id
               WHERE ps.fixture_id IS NULL
               ORDER BY f.id LIMIT $1`,
        values: [maxFixtures],
      }
    : {
        text: `SELECT f.id FROM fixtures f
               LEFT JOIN player_stats ps ON ps.fixture_id = f.id
               WHERE ps.fixture_id IS NULL
               ORDER BY f.id`,
      };

  const result = await pool.query(query);
  const fixtures = result.rows;

  const totalRequests = fixtures.length * 3;
  if (totalRequests > 100) {
    logger.warn({ fixtures: fixtures.length, estimatedRequests: totalRequests },
      `WARNING: This will consume ~${totalRequests} API requests (max 100/day!)`);
  }

  let ok = 0, fail = 0;

  for (const f of fixtures) {
    try {
      await syncService.syncMatchDetails(f.id);
      ok++;
      logger.info({ fixtureId: f.id, progress: `${ok+fail}/${fixtures.length}` }, 'Match synced');
    } catch (err) {
      fail++;
      logger.error({ fixtureId: f.id, err: err.message }, 'Match sync failed');
    }
  }

  logger.info({ total: fixtures.length, ok, fail, estimatedRequests: ok * 3 }, 'Match details sync complete');
  await pool.end();
}

main();
