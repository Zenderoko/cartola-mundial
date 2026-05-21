function validate(schema, source = 'query') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details },
      });
    }
    req[source] = result.data;
    next();
  };
}

function validateBody(schema) {
  return validate(schema, 'body');
}

function validateQuery(schema) {
  return validate(schema, 'query');
}

function validateParams(schema) {
  return validate(schema, 'params');
}

module.exports = { validate, validateBody, validateQuery, validateParams };
