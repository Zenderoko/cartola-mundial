const { logger } = require('../utils/logger');
const { error } = require('../utils/response');

class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return error(res, err.status, err.code, err.message, err.details);
  }

  if (err.name === 'ZodError') {
    const details = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return error(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  return error(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  );
}

module.exports = { errorHandler, AppError };
