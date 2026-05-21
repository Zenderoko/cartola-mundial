const { pool } = require('../config/database');

class FavoriteRepo {
  async findAll(clerkUserId, entityType) {
    const conditions = ['f.clerk_user_id = $1'];
    const params = [clerkUserId];
    let idx = 2;

    if (entityType) {
      conditions.push(`f.entity_type = $${idx}`);
      params.push(entityType);
      idx++;
    }

    const result = await pool.query(
      `SELECT f.id, f.entity_type, f.entity_id, f.created_at,
        CASE WHEN f.entity_type = 'team'
          THEN jsonb_build_object('id', t.id, 'name', t.name, 'logo', t.logo, 'code', t.code)
          ELSE jsonb_build_object('id', p.id, 'name', p.name, 'photo', p.photo, 'position', p.position)
        END AS entity
      FROM favorites f
      LEFT JOIN teams t ON t.id = f.entity_id AND f.entity_type = 'team'
      LEFT JOIN players p ON p.id = f.entity_id AND f.entity_type = 'player'
      WHERE ${conditions.join(' AND ')}
      ORDER BY f.created_at DESC`,
      params
    );
    return result.rows;
  }

  async findOne(clerkUserId, entityType, entityId) {
    const result = await pool.query(
      `SELECT * FROM favorites WHERE clerk_user_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [clerkUserId, entityType, entityId]
    );
    return result.rows[0] || null;
  }

  async create(clerkUserId, entityType, entityId) {
    const result = await pool.query(
      `INSERT INTO favorites (clerk_user_id, entity_type, entity_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (clerk_user_id, entity_type, entity_id) DO NOTHING
       RETURNING *`,
      [clerkUserId, entityType, entityId]
    );
    return result.rows[0] || null;
  }

  async delete(id, clerkUserId) {
    const result = await pool.query(
      'DELETE FROM favorites WHERE id = $1 AND clerk_user_id = $2 RETURNING id',
      [id, clerkUserId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new FavoriteRepo();
