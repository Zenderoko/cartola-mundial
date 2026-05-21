const { pool } = require('../config/database');

class PlayerRepo {
  async findAll({ team_id, position, search, sort, page = 1, perPage = 50 }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (team_id) { conditions.push(`p.team_id = $${idx}`); params.push(team_id); idx++; }
    if (position) {
      const posMap = { Goalkeeper: ['Goalkeeper', 'G'], Defender: ['Defender', 'D'], Midfielder: ['Midfielder', 'M'], Attacker: ['Attacker', 'F'] };
      const vals = posMap[position] || [position];
      conditions.push(`p.position IN (${vals.map((_, i) => `$${idx + i}`).join(',')})`);
      params.push(...vals);
      idx += vals.length;
    }
    if (search) { conditions.push(`p.name ILIKE $${idx}`); params.push(`%${search}%`); idx++; }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortMap = {
      name_asc: 'p.name ASC', name_desc: 'p.name DESC',
      rating_desc: 'avg_rating DESC NULLS LAST',
      goals_desc: 'total_goals DESC', assists_desc: 'total_assists DESC',
    };
    const offset = (page - 1) * perPage;

    const countResult = await pool.query(`SELECT COUNT(*) FROM players p ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT p.id, p.name, p.position, p.age, p.nationality,
        p.height, p.weight, p.photo, p.number,
        jsonb_build_object('id', t.id, 'name', t.name, 'logo', t.logo, 'code', t.code) AS team,
        COALESCE(tps.goals, 0) AS total_goals,
        COALESCE(tps.assists, 0) AS total_assists,
        COALESCE(tps.appearances, 0) AS appearances,
        tps.avg_rating
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN (
        SELECT ps.player_id,
          COUNT(DISTINCT ps.fixture_id) AS appearances,
          SUM(ps.goals) AS goals, SUM(ps.assists) AS assists,
          AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS avg_rating
        FROM player_stats ps
        JOIN fixtures f ON f.id = ps.fixture_id
        WHERE f.status = 'match finished'
        GROUP BY ps.player_id
      ) tps ON tps.player_id = p.id
      ${where}
      ORDER BY ${sortMap[sort] || sortMap.name_asc}
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, perPage, offset]
    );

    return {
      rows: result.rows.map((r) => ({
        id: r.id, name: r.name, position: r.position, age: r.age,
        nationality: r.nationality, height: r.height, weight: r.weight,
        photo: r.photo, number: r.number, team: r.team,
        statistics: {
          goals: parseInt(r.total_goals) || 0,
          assists: parseInt(r.total_assists) || 0,
          rating: r.avg_rating ? parseFloat(r.avg_rating).toFixed(2) : null,
          appearances: parseInt(r.appearances) || 0,
        },
      })),
      total,
    };
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT p.*,
        jsonb_build_object('id', t.id, 'name', t.name, 'logo', t.logo, 'code', t.code) AS team
      FROM players p JOIN teams t ON t.id = p.team_id WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getMatchHistory(playerId) {
    const result = await pool.query(
      `SELECT ps.fixture_id, f.round, f.date,
        ps.rating, ps.minutes_played, ps.position,
        ps.goals, ps.assists, ps.shots, ps.shots_on_target,
        ps.key_passes, ps.passes, ps.accurate_passes,
        ps.tackles, ps.interceptions, ps.fouls, ps.fouls_drawn,
        ps.yellow_card, ps.red_card, ps.saves, ps.goals_conceded,
        ps.man_of_the_match,
        CASE WHEN f.home_team_id = ps.team_id
          THEN jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo)
          ELSE jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo)
        END AS opponent,
        CASE WHEN ps.team_id = f.home_team_id THEN f.home_score ELSE f.away_score END AS team_score,
        CASE WHEN ps.team_id = f.home_team_id THEN f.away_score ELSE f.home_score END AS opponent_score
      FROM player_stats ps
      JOIN fixtures f ON f.id = ps.fixture_id
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE ps.player_id = $1 AND f.status = 'match finished'
      ORDER BY f.date ASC`,
      [playerId]
    );
    return result.rows;
  }

  async getCareerTotals(playerId) {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        COALESCE(SUM(ps.minutes_played), 0) AS minutes_played,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COALESCE(SUM(ps.assists), 0) AS assists,
        COALESCE(SUM(ps.shots), 0) AS shots,
        COALESCE(SUM(ps.shots_on_target), 0) AS shots_on_target,
        COALESCE(SUM(ps.key_passes), 0) AS key_passes,
        COALESCE(SUM(ps.passes), 0) AS passes,
        CASE WHEN SUM(ps.passes) > 0 THEN ROUND(100.0 * SUM(ps.accurate_passes) / SUM(ps.passes), 1) ELSE 0 END AS pass_accuracy,
        COALESCE(SUM(ps.tackles), 0) AS tackles,
        COALESCE(SUM(ps.fouls), 0) AS fouls,
        COALESCE(SUM(ps.fouls_drawn), 0) AS fouls_drawn,
        COALESCE(COUNT(*) FILTER (WHERE ps.yellow_card), 0) AS yellow_cards,
        COALESCE(COUNT(*) FILTER (WHERE ps.red_card), 0) AS red_cards,
        COALESCE(COUNT(*) FILTER (WHERE ps.man_of_the_match), 0) AS man_of_the_match,
        AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS average_rating,
        COALESCE(SUM(ps.saves), 0) AS saves,
        COALESCE(SUM(ps.goals_conceded), 0) AS goals_conceded
      FROM player_stats ps
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ps.player_id = $1 AND f.status = 'match finished'`,
      [playerId]
    );
    return result.rows[0] || null;
  }

  async getTopByGoals(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;
    if (teamId) { conditions.push(`p.team_id = $${idx}`); params.push(teamId); idx++; }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.goals) DESC, AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.goals), 0) AS DECIMAL) / NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS goals_per_match,
        AVG(ps.rating) AS avg_rating
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.goals) > 0
      ORDER BY goals DESC, avg_rating DESC
      LIMIT $1`, params
    );
    return result.rows;
  }

  async getTopByAssists(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;
    if (teamId) { conditions.push(`p.team_id = $${idx}`); params.push(teamId); idx++; }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.assists) DESC, AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.assists), 0) AS assists,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.assists), 0) AS DECIMAL) / NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS assists_per_match,
        AVG(ps.rating) AS avg_rating
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.assists) > 0
      ORDER BY assists DESC, avg_rating DESC
      LIMIT $1`, params
    );
    return result.rows;
  }

  async getTopByRating(limit = 20, teamId = null, minAppearances = 2) {
    const conditions = ['f.status = \'match finished\'', 'ps.rating IS NOT NULL'];
    const params = [limit, minAppearances];
    let idx = 3;
    if (teamId) { conditions.push(`p.team_id = $${idx}`); params.push(teamId); idx++; }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY AVG(ps.rating) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        ROUND(AVG(ps.rating)::DECIMAL, 2) AS avg_rating,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        COALESCE(SUM(ps.goals), 0) AS goals, COALESCE(SUM(ps.assists), 0) AS assists
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING COUNT(DISTINCT ps.fixture_id) >= $2
      ORDER BY avg_rating DESC
      LIMIT $1`, params
    );
    return result.rows;
  }

  async getTopBySaves(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\'', 'p.position = \'Goalkeeper\''];
    const params = [limit];
    let idx = 2;
    if (teamId) { conditions.push(`p.team_id = $${idx}`); params.push(teamId); idx++; }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(ps.saves) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(SUM(ps.saves), 0) AS saves,
        COALESCE(SUM(ps.goals_conceded), 0) AS goals_conceded,
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        ROUND(CAST(COALESCE(SUM(ps.saves), 0) AS DECIMAL) / NULLIF(COUNT(DISTINCT ps.fixture_id), 0), 2) AS saves_per_match
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING SUM(ps.saves) > 0
      ORDER BY saves DESC
      LIMIT $1`, params
    );
    return result.rows;
  }

  async getTopByCards(limit = 20, teamId = null) {
    const conditions = ['f.status = \'match finished\''];
    const params = [limit];
    let idx = 2;
    if (teamId) { conditions.push(`p.team_id = $${idx}`); params.push(teamId); idx++; }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
        ROW_NUMBER() OVER (ORDER BY COUNT(*) FILTER (WHERE ps.red_card) * 3 + COUNT(*) FILTER (WHERE ps.yellow_card) DESC) AS position,
        p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COUNT(*) FILTER (WHERE ps.yellow_card) AS yellow_cards,
        COUNT(*) FILTER (WHERE ps.red_card) AS red_cards,
        COUNT(DISTINCT ps.fixture_id) AS appearances
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = p.team_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ${where}
      GROUP BY p.id, p.name, p.photo, t.name, t.logo
      HAVING COUNT(*) FILTER (WHERE ps.yellow_card) > 0 OR COUNT(*) FILTER (WHERE ps.red_card) > 0
      ORDER BY position ASC
      LIMIT $1`, params
    );
    return result.rows;
  }
}

module.exports = new PlayerRepo();
