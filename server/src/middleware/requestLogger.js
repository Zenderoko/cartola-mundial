const { logger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userId: req.user?.clerk_user_id,
    }, 'Request completed');
  });
  next();
}

module.exports = { requestLogger };
