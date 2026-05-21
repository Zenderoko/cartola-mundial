const { pool } = require('../config/database');

class TeamRepo {
  async findAll({ group, search, page = 1, perPage = 48 }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (group) {
      conditions.push(`t.group_name = $${idx}`);
      params.push(group);
      idx++;
    }
    if (search) {
      conditions.push(`t.name ILIKE $${idx}`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM teams t ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT t.id, t.name, t.code, t.country, t.logo, t.group_name, t.fifa_rank,
        COALESCE(COUNT(DISTINCT f.id), 0) AS played,
        COALESCE(COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = t.id AND f.home_score > f.away_score)
             OR (f.away_team_id = t.id AND f.away_score > f.home_score)
        ), 0) AS wins,
        COALESCE(COUNT(DISTINCT f.id) FILTER (WHERE f.home_score = f.away_score), 0) AS draws,
        COALESCE(COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = t.id AND f.home_score < f.away_score)
             OR (f.away_team_id = t.id AND f.away_score < f.home_score)
        ), 0) AS losses,
        COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.home_score ELSE f.away_score END), 0) AS goals_for,
        COALESCE(SUM(CASE WHEN f.home_team_id = t.id THEN f.away_score ELSE f.home_score END), 0) AS goals_against
      FROM teams t
      LEFT JOIN fixtures f ON (f.home_team_id = t.id OR f.away_team_id = t.id) AND f.status = 'match finished'
      ${where}
      GROUP BY t.id, t.name, t.code, t.country, t.logo, t.group_name, t.fifa_rank
      ORDER BY t.group_name, t.name
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    const rows = result.rows.map((r) => ({
      ...r,
      played: parseInt(r.played),
      wins: parseInt(r.wins),
      draws: parseInt(r.draws),
      losses: parseInt(r.losses),
      goals_for: parseInt(r.goals_for),
      goals_against: parseInt(r.goals_against),
    }));

    return { rows, total };
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getSquad(teamId) {
    const result = await pool.query(
      `SELECT id, name, position, age, nationality, height, weight, photo, number
      FROM players WHERE team_id = $1
      ORDER BY
        CASE position
          WHEN 'Goalkeeper' THEN 1 WHEN 'Defender' THEN 2
          WHEN 'Midfielder' THEN 3 WHEN 'Attacker' THEN 4 ELSE 5
        END,
        number ASC NULLS LAST`,
      [teamId]
    );
    return result.rows;
  }

  async getTeamStats(teamId) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT f.id) AS played,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score > f.away_score)
             OR (f.away_team_id = $1 AND f.away_score > f.home_score)
        ) AS wins,
        COUNT(DISTINCT f.id) FILTER (
          WHERE f.home_score = f.away_score
            AND (f.home_team_id = $1 OR f.away_team_id = $1)
        ) AS draws,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score < f.away_score)
             OR (f.away_team_id = $1 AND f.away_score < f.home_score)
        ) AS losses,
        COALESCE(SUM(CASE WHEN f.home_team_id = $1 THEN f.home_score ELSE f.away_score END), 0) AS goals_for,
        COALESCE(SUM(CASE WHEN f.home_team_id = $1 THEN f.away_score ELSE f.home_score END), 0) AS goals_against,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.away_score = 0)
             OR (f.away_team_id = $1 AND f.home_score = 0)
        ) AS clean_sheets,
        AVG(fs_stats.possession) AS average_possession,
        COALESCE(SUM(fs_stats.yellow_cards), 0) AS yellow_cards,
        COALESCE(SUM(fs_stats.red_cards), 0) AS red_cards,
        AVG(ps_stats.average_rating) AS average_rating
      FROM fixtures f
      LEFT JOIN (
        SELECT fixture_id, team_id,
          AVG(possession) AS possession,
          SUM(yellow_cards) AS yellow_cards,
          SUM(red_cards) AS red_cards
        FROM fixture_stats WHERE team_id = $1
        GROUP BY fixture_id, team_id
      ) fs_stats ON fs_stats.fixture_id = f.id
      LEFT JOIN (
        SELECT fixture_id, team_id,
          AVG(rating) AS average_rating
        FROM player_stats WHERE team_id = $1 AND rating IS NOT NULL
        GROUP BY fixture_id, team_id
      ) ps_stats ON ps_stats.fixture_id = f.id
      WHERE (f.home_team_id = $1 OR f.away_team_id = $1)
        AND f.status = 'match finished'`,
      [teamId]
    );

    const base = result.rows[0];
    if (!base || !parseInt(base.played)) return null;

    return {
      team_id: Number(teamId),
      played: parseInt(base.played),
      wins: parseInt(base.wins),
      draws: parseInt(base.draws),
      losses: parseInt(base.losses),
      goals_for: parseInt(base.goals_for),
      goals_against: parseInt(base.goals_against),
      goal_difference: parseInt(base.goals_for) - parseInt(base.goals_against),
      clean_sheets: parseInt(base.clean_sheets),
      average_possession: parseFloat(base.average_possession).toFixed(1),
      average_rating: parseFloat(base.average_rating).toFixed(2),
      cards: { yellow: parseInt(base.yellow_cards), red: parseInt(base.red_cards) },
    };
  }

  async getTopScorer(teamId) {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name, COALESCE(SUM(ps.goals), 0) AS goals
      FROM players p
      JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE p.team_id = $1 AND f.status = 'match finished'
      GROUP BY p.id, p.name ORDER BY goals DESC LIMIT 1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  async getTopAssist(teamId) {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name, COALESCE(SUM(ps.assists), 0) AS assists
      FROM players p
      JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE p.team_id = $1 AND f.status = 'match finished'
      GROUP BY p.id, p.name ORDER BY assists DESC LIMIT 1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  async upsert(team) {
    const t = team.team || team;
    const result = await pool.query(
      `INSERT INTO teams (id, name, code, country, logo, group_name, fifa_rank, cache_until)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days')
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, code = EXCLUDED.code,
        country = EXCLUDED.country, logo = EXCLUDED.logo,
        group_name = EXCLUDED.group_name, fifa_rank = EXCLUDED.fifa_rank,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted`,
      [t.id, t.name, t.code || null, t.country || null, t.logo || null, null, null]
    );
    return { action: result.rows[0]?.inserted ? 'inserted' : 'updated' };
  }

  async upsertMany(teams) {
    let inserted = 0, updated = 0;
    for (const team of teams) {
      const r = await this.upsert(team);
      if (r.action === 'inserted') inserted++;
      else updated++;
    }
    return { inserted, updated };
  }

  async saveSquad(teamId, players) {
    let inserted = 0, updated = 0;
    for (const player of players) {
      const result = await pool.query(
        `INSERT INTO players (id, team_id, name, position, age, nationality, height, weight, photo, number, cache_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '30 days')
        ON CONFLICT (id) DO UPDATE SET
          team_id = EXCLUDED.team_id, number = EXCLUDED.number, updated_at = NOW()
        RETURNING (xmax = 0) AS inserted`,
        [player.id, teamId, player.name, player.position || null, player.age || null,
         player.nationality || null, player.height || null, player.weight || null,
         player.photo || null, player.number || null]
      );
      if (result.rows[0]?.inserted) inserted++;
      else updated++;
    }
    return { inserted, updated, total: players.length };
  }

  async updateGroupName(teamId, groupName) {
    await pool.query(
      'UPDATE teams SET group_name = COALESCE(group_name, $1) WHERE id = $2 AND group_name IS NULL',
      [groupName, teamId]
    );
  }

  async getDistinctGroups() {
    const result = await pool.query(
      `SELECT DISTINCT group_name FROM teams WHERE group_name IS NOT NULL ORDER BY group_name`
    );
    return result.rows.map(r => r.group_name);
  }

  async getTotalCount() {
    const result = await pool.query('SELECT COUNT(*) FROM teams');
    return parseInt(result.rows[0].count);
  }
}

module.exports = new TeamRepo();
