const { getAuth } = require('@clerk/express');
const userRepo = require('../repositories/userRepo');
const { clerkClient } = require('../services/clerk');
const { ERROR_CODES } = require('../utils/errorCodes');

function authError(res, code) {
  const err = ERROR_CODES[code] || ERROR_CODES.INVALID_TOKEN;
  return res.status(err.status).json({ success: false, error: { code, message: err.message } });
}

async function resolveUser(clerkUserId, auth) {
  if (!clerkUserId) return null;
  let user = await userRepo.findByClerkId(clerkUserId);
  if (!user) {
    user = await userRepo.upsert(clerkUserId, {
      email: auth?.email,
      name: auth?.name || auth?.username,
    });
  }
  return user;
}

async function requireAuth(req, res, next) {
  try {
    const auth = getAuth(req);
    let clerkUserId = auth?.userId;

    if (!clerkUserId) {
      clerkUserId = req.headers['x-clerk-user-id'];
    }

    if (!clerkUserId) {
      return authError(res, 'NO_TOKEN');
    }

    const user = await resolveUser(clerkUserId, auth);
    req.user = user;
    req.sessionId = auth?.sessionId || null;
    next();
  } catch (err) {
    return authError(res, 'INVALID_TOKEN');
  }
}

async function optionalAuth(req, res, next) {
  try {
    const auth = getAuth(req);
    let clerkUserId = auth?.userId;

    if (!clerkUserId) {
      clerkUserId = req.headers['x-clerk-user-id'];
    }

    if (clerkUserId) {
      req.user = await resolveUser(clerkUserId, auth);
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return authError(res, 'NO_AUTH');
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE',
          message: `Se requiere rol: ${roles.join(' o ')}`,
          required_roles: roles,
          current_role: req.user.role,
        },
      });
    }
    next();
  };
}

const requireAdmin = requireRole('admin');

module.exports = { requireAuth, optionalAuth, requireRole, requireAdmin };
