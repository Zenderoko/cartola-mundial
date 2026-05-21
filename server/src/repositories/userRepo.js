const { pool } = require('../config/database');

class UserRepo {
  async findByClerkId(clerkUserId) {
    const result = await pool.query(
      'SELECT id, clerk_user_id, email, name, avatar_url, tier, role, premium_since, is_active FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    return result.rows[0] || null;
  }

  async upsert(clerkUserId, data = {}) {
    const result = await pool.query(
      `INSERT INTO users (clerk_user_id, email, name, avatar_url, last_login_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE SET
         last_login_at = NOW(),
         email = COALESCE($2, users.email),
         name = COALESCE($3, users.name),
         avatar_url = COALESCE($4, users.avatar_url)
       RETURNING id, clerk_user_id, email, name, tier, role, avatar_url, premium_since`,
      [clerkUserId, data.email || null, data.name || null, data.avatar_url || null]
    );
    return result.rows[0];
  }

  async softDelete(clerkUserId) {
    await pool.query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE clerk_user_id = $1',
      [clerkUserId]
    );
  }

  async addHistory(clerkUserId, action, details = {}) {
    await pool.query(
      'INSERT INTO user_history (clerk_user_id, action, details) VALUES ($1, $2, $3)',
      [clerkUserId, action, JSON.stringify(details)]
    );
  }

  async getHistory(clerkUserId, { action, limit = 20 } = {}) {
    const conditions = ['clerk_user_id = $1'];
    const params = [clerkUserId];
    let idx = 2;
    if (action) { conditions.push(`action = $${idx}`); params.push(action); idx++; }
    params.push(limit);
    const result = await pool.query(
      `SELECT id, action, details, created_at FROM user_history
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC LIMIT $${idx}`,
      params
    );
    return result.rows;
  }
}

module.exports = new UserRepo();
