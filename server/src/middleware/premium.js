async function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_AUTH', message: 'Autenticación requerida' },
    });
  }

  if (req.user.role === 'admin') return next();

  if (req.user.tier !== 'premium') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PREMIUM_REQUIRED',
        message: 'Esta funcionalidad requiere cuenta premium',
        upgrade_url: '/pricing',
        features: [
          'Múltiples cartolas',
          'Estadísticas avanzadas',
          'Historial completo',
          'Sin anuncios',
        ],
      },
    });
  }

  next();
}

module.exports = { requirePremium };
