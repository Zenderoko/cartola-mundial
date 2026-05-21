const Bottleneck = require('bottleneck');
const { env } = require('../config/env');

const RATE_LIMIT = env.API_FOOTBALL_RATE_LIMIT;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: Math.ceil(60000 / RATE_LIMIT),
  reservoir: RATE_LIMIT,
  reservoirRefreshAmount: RATE_LIMIT,
  reservoirRefreshInterval: 60 * 1000,
});

limiter.on('depleted', () => {
  console.warn('API-Football rate limit reservoir depleted, queue paused');
});

module.exports = { limiter };
