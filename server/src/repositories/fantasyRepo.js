const { pool } = require('../config/database');

class FantasyRepo {
  async getTeam(clerkUserId) {
    const result = await pool.query(
      `SELECT ft.*,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', fp.id, 'player_id', fp.player_id, 'round', fp.round,
            'position_slot', fp.position_slot,
            'is_captain', fp.is_captain, 'is_vice_captain', fp.is_vice_captain,
            'points_earned', fp.points_earned,
            'player_name', p.name, 'position', p.position,
            'photo', p.photo, 'team_id', p.team_id,
            'team_name', t.name, 'team_logo', t.logo
          ) ORDER BY fp.position_slot)
          FILTER (WHERE fp.id IS NOT NULL), '[]'
        ) AS picks
      FROM fantasy_teams ft
      LEFT JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
      LEFT JOIN players p ON p.id = fp.player_id
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE ft.clerk_user_id = $1 AND ft.is_active = TRUE
      GROUP BY ft.id`,
      [clerkUserId]
    );
    return result.rows[0] || null;
  }

  async getTeamById(id) {
    const result = await pool.query(
      `SELECT ft.*,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'id', fp.id, 'player_id', fp.player_id, 'round', fp.round,
            'position_slot', fp.position_slot,
            'is_captain', fp.is_captain, 'is_vice_captain', fp.is_vice_captain,
            'points_earned', fp.points_earned,
            'player_name', p.name, 'position', p.position,
            'photo', p.photo, 'team_id', p.team_id,
            'team_name', t.name, 'team_logo', t.logo
          ) ORDER BY fp.position_slot)
          FILTER (WHERE fp.id IS NOT NULL), '[]'
        ) AS picks
      FROM fantasy_teams ft
      LEFT JOIN fantasy_picks fp ON fp.fantasy_team_id = ft.id
      LEFT JOIN players p ON p.id = fp.player_id
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE ft.id = $1
      GROUP BY ft.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async createTeam(clerkUserId, name, formation = '4-3-3') {
    const result = await pool.query(
      `INSERT INTO fantasy_teams (clerk_user_id, name, formation)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clerkUserId, name, formation]
    );
    return result.rows[0];
  }

  async updateTeam(id, clerkUserId, updates) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (updates.name) { fields.push(`name = $${idx}`); params.push(updates.name); idx++; }
    if (updates.formation) { fields.push(`formation = $${idx}`); params.push(updates.formation); idx++; }

    if (fields.length === 0) return null;

    params.push(id, clerkUserId);
    const result = await pool.query(
      `UPDATE fantasy_teams SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND clerk_user_id = $${idx + 1}
       RETURNING *`,
      params
    );
    return result.rows[0] || null;
  }

  async savePicks(fantasyTeamId, picks, round) {
    await pool.query(
      'DELETE FROM fantasy_picks WHERE fantasy_team_id = $1 AND round = $2',
      [fantasyTeamId, round]
    );

    let inserted = 0;
    for (const pick of picks) {
      await pool.query(
        `INSERT INTO fantasy_picks (fantasy_team_id, player_id, round, position_slot, is_captain, is_vice_captain)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [fantasyTeamId, pick.player_id, round, pick.position_slot, pick.is_captain || false, pick.is_vice_captain || false]
      );
      inserted++;
    }
    return { inserted };
  }

  async getPicksByRound(fantasyTeamId, round) {
    const result = await pool.query(
      `SELECT fp.*, p.name AS player_name, p.position, p.photo, p.team_id,
        t.name AS team_name, t.logo AS team_logo
      FROM fantasy_picks fp
      JOIN players p ON p.id = fp.player_id
      JOIN teams t ON t.id = p.team_id
      WHERE fp.fantasy_team_id = $1 AND fp.round = $2
      ORDER BY fp.position_slot`,
      [fantasyTeamId, round]
    );
    return result.rows;
  }

  async getCurrentRound() {
    const result = await pool.query(
      `SELECT DISTINCT round FROM fixtures
       WHERE status IN ('scheduled', 'live', 'match finished')
       ORDER BY round DESC LIMIT 1`
    );
    return result.rows[0]?.round || 1;
  }

  async getPointsBreakdown(fantasyTeamId) {
    const result = await pool.query(
      `SELECT fp.player_id, p.name AS player_name, p.position, p.photo,
        fp.is_captain, fp.is_vice_captain,
        fp.points_earned, fp.position_slot
      FROM fantasy_picks fp
      JOIN players p ON p.id = fp.player_id
      WHERE fp.fantasy_team_id = $1
      ORDER BY fp.position_slot`,
      [fantasyTeamId]
    );
    return result.rows;
  }

  async removePick(fantasyTeamId, playerId, round) {
    const result = await pool.query(
      'DELETE FROM fantasy_picks WHERE fantasy_team_id = $1 AND player_id = $2 AND round = $3 RETURNING id',
      [fantasyTeamId, playerId, round]
    );
    return result.rows[0] || null;
  }

  async deactivateOtherTeams(clerkUserId, excludeTeamId) {
    await pool.query(
      'UPDATE fantasy_teams SET is_active = FALSE, updated_at = NOW() WHERE clerk_user_id = $1 AND id != $2',
      [clerkUserId, excludeTeamId]
    );
  }

  async getOrCreateTeam(clerkUserId, name) {
    let team = await this.getTeam(clerkUserId);
    if (!team) {
      team = await this.createTeam(clerkUserId, name || 'Mi Cartola');
    }
    return team;
  }
}

module.exports = new FantasyRepo();
