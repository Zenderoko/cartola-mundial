const { Router } = require('express');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');
const { error } = require('../utils/response');

const router = Router();

router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;

    if (payload.type === 'user.created' || payload.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = payload.data;
      const email = email_addresses?.[0]?.email_address || null;
      const name = [first_name, last_name].filter(Boolean).join(' ') || null;

      const result = await pool.query(
        `INSERT INTO users (clerk_user_id, email, name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (clerk_user_id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()
         RETURNING id`,
        [id, email, name, image_url]
      );

      logger.info({ clerkUserId: id, action: payload.type }, 'User synced from Clerk webhook');
    }

    if (payload.type === 'user.deleted') {
      const { id } = payload.data;
      await pool.query('DELETE FROM users WHERE clerk_user_id = $1', [id]);
      logger.info({ clerkUserId: id }, 'User deleted via Clerk webhook');
    }

    if (payload.type === 'session.created') {
      await pool.query(
        'UPDATE users SET last_login_at = NOW() WHERE clerk_user_id = $1',
        [payload.data.user_id]
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, body: req.body }, 'Webhook processing failed');
    return error(res, 500, 'WEBHOOK_ERROR', 'Failed to process webhook');
  }
});

module.exports = router;
