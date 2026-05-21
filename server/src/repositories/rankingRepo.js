const { pool } = require('../config/database');

class RankingRepo {
  async getGlobalRanking(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY ft.total_points DESC) AS position,
        ft.id AS fantasy_team_id,
        ft.name AS fantasy_team_name,
        u.name AS user_name,
        u.avatar_url,
        ft.total_points,
        ft.round_points,
        ft.formation
      FROM fantasy_teams ft
      JOIN users u ON u.clerk_user_id = ft.clerk_user_id
      WHERE ft.is_active = TRUE
      ORDER BY ft.total_points DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM fantasy_teams WHERE is_active = TRUE`
    );

    return { rows: result.rows, total: parseInt(countResult.rows[0].count) };
  }

  async getRoundRanking(round, limit = 100) {
    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(fp.points_earned) DESC) AS position,
        ft.id AS fantasy_team_id,
        ft.name AS fantasy_team_name,
        u.name AS user_name,
        u.clerk_user_id,
        SUM(fp.points_earned) AS round_points,
        COUNT(fp.id) AS players_used
      FROM fantasy_picks fp
      JOIN fantasy_teams ft ON ft.id = fp.fantasy_team_id
      JOIN users u ON u.clerk_user_id = ft.clerk_user_id
      WHERE fp.round = $1 AND ft.is_active = TRUE
      GROUP BY ft.id, ft.name, u.name, u.clerk_user_id
      ORDER BY round_points DESC
      LIMIT $2`,
      [round, limit]
    );
    return result.rows;
  }

  async getDistinctRounds() {
    const result = await pool.query(
      'SELECT DISTINCT round FROM fantasy_picks ORDER BY round DESC'
    );
    return result.rows.map((r) => r.round);
  }

  async getUserRankingPosition(clerkUserId) {
    const result = await pool.query(
      `SELECT COUNT(*) + 1 AS position
       FROM fantasy_teams ft2
       WHERE ft2.total_points > (
         SELECT COALESCE(ft.total_points, 0)
         FROM fantasy_teams ft
         WHERE ft.clerk_user_id = $1 AND ft.is_active = TRUE
       ) AND ft2.is_active = TRUE`,
      [clerkUserId]
    );
    return parseInt(result.rows[0]?.position) || null;
  }
}

module.exports = new RankingRepo();
