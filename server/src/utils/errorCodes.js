const ERROR_CODES = {
  NO_TOKEN: { status: 401, message: 'Token de autenticación requerido' },
  TOKEN_EXPIRED: { status: 401, message: 'Token expirado' },
  TOKEN_INVALID: { status: 401, message: 'Token inválido' },
  INVALID_TOKEN: { status: 401, message: 'Token inválido o expirado' },
  NO_AUTH: { status: 401, message: 'Autenticación requerida' },
  FORBIDDEN_ROLE: { status: 403, message: 'No tienes permisos para esta acción' },
  PREMIUM_REQUIRED: { status: 403, message: 'Esta funcionalidad requiere cuenta premium' },
  NOT_FOUND: { status: 404, message: 'Recurso no encontrado' },
  VALIDATION_ERROR: { status: 400, message: 'Datos inválidos' },
  RATE_LIMITED: { status: 429, message: 'Demasiadas solicitudes' },
  INTERNAL_ERROR: { status: 500, message: 'Error interno del servidor' },
  MISSING_PARAMS: { status: 400, message: 'Parámetros requeridos faltantes' },
  USER_NOT_SYNCED: { status: 404, message: 'Usuario no sincronizado' },
  NO_TEAM: { status: 404, message: 'Crea una cartola primero' },
};

module.exports = { ERROR_CODES };
