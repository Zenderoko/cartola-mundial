const { pool } = require('../config/database');

const MARKET_CONFIG = {
  goals:         { label: 'Goles totales',       line: 2,  icon: '⚽' },
  both_score:    { label: 'Ambos equipos anotan', line: null, icon: '🤝' },
  corners:       { label: 'Corners totales',     line: 9,  icon: '🏳' },
  yellow_cards:  { label: 'Tarjetas amarillas',  line: 3,  icon: '🟨' },
  red_card:      { label: 'Tarjeta roja',        line: null, icon: '🟥' },
  fouls:         { label: 'Faltas totales',      line: 20, icon: '🦶' },
};

class PredictionRepo {
  getMarkets() {
    return MARKET_CONFIG;
  }

  async getUpcomingMatches(userId) {
    const result = await pool.query(
      `SELECT f.id, f.round, f.date, f.status, f.stage,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code) AS away_team,
        f.home_score, f.away_score,
        COALESCE(
          (SELECT jsonb_object_agg(p.market, jsonb_build_object('prediction', p.prediction, 'line', p.line, 'is_correct', p.is_correct, 'settled', p.settled))
           FROM predictions p WHERE p.fixture_id = f.id AND p.user_id = $1),
          '{}'::jsonb
        ) AS my_predictions,
        COALESCE(
          (SELECT jsonb_object_agg(fs.team_id::text, jsonb_build_object(
            'corners', fs.corners, 'yellow_cards', fs.yellow_cards, 'red_cards', fs.red_cards,
            'fouls', fs.fouls, 'shots', fs.shots, 'shots_on_target', fs.shots_on_target,
            'possession', fs.possession, 'total_passes', fs.total_passes
          )) FROM fixture_stats fs WHERE fs.fixture_id = f.id),
          '{}'::jsonb
        ) AS stats,
        (SELECT jsonb_build_object(
          'goals', COALESCE(f.home_score, 0) + COALESCE(f.away_score, 0),
          'both_score', CASE WHEN COALESCE(f.home_score, 0) > 0 AND COALESCE(f.away_score, 0) > 0 THEN 'yes' ELSE 'no' END,
          'corners', COALESCE(SUM(fs2.corners), 0)::int,
          'yellow_cards', COALESCE(SUM(fs2.yellow_cards), 0)::int,
          'red_card', CASE WHEN COALESCE(SUM(fs2.red_cards), 0) > 0 THEN 'yes' ELSE 'no' END,
          'fouls', COALESCE(SUM(fs2.fouls), 0)::int
        ) FROM fixture_stats fs2 WHERE fs2.fixture_id = f.id) AS actual_result
      FROM fixtures f
      JOIN teams ht ON ht.id = f.home_team_id
      JOIN teams at ON at.id = f.away_team_id
      WHERE f.status IN ('scheduled', 'live', 'match finished', 'match cancelled')
      ORDER BY f.date ASC`,
      [userId]
    );
    return result.rows;
  }

  async getMyPredictions(userId) {
    const result = await pool.query(
      `SELECT p.*, f.round, f.date, f.status, f.home_score, f.away_score,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code) AS away_team
      FROM predictions p
      JOIN fixtures f ON f.id = p.fixture_id
      JOIN teams ht ON ht.id = f.home_team_id
      JOIN teams at ON at.id = f.away_team_id
      WHERE p.user_id = $1
      ORDER BY f.date DESC, p.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async create(userId, fixtureId, market, line, prediction) {
    const result = await pool.query(
      `INSERT INTO predictions (user_id, fixture_id, market, line, prediction)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, fixture_id, market)
       DO UPDATE SET prediction = $5, line = $4, settled = FALSE, is_correct = NULL, points = 0
       RETURNING *`,
      [userId, fixtureId, market, line, prediction]
    );
    return result.rows[0];
  }

  async getLeaderboard() {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar_url, u.clerk_user_id,
        COALESCE(SUM(p.points), 0) AS total_points,
        COUNT(p.id) FILTER (WHERE p.is_correct = TRUE) AS correct_picks,
        COUNT(p.id) AS total_picks,
        ROUND(100.0 * COUNT(p.id) FILTER (WHERE p.is_correct = TRUE) / NULLIF(COUNT(p.id), 0), 1) AS accuracy
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id AND p.settled = TRUE
      GROUP BY u.id, u.name, u.avatar_url, u.clerk_user_id
      HAVING COUNT(p.id) > 0
      ORDER BY total_points DESC
      LIMIT 50`
    );
    return result.rows;
  }

  async getByFixture(fixtureId) {
    const result = await pool.query(
      `SELECT p.*, u.clerk_user_id
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       WHERE p.fixture_id = $1 AND p.settled = FALSE`,
      [fixtureId]
    );
    return result.rows;
  }

  async settle(fixtureId) {
    const fixture = await pool.query(
      `SELECT id, home_score, away_score, status FROM fixtures WHERE id = $1`,
      [fixtureId]
    );
    if (!fixture.rows[0]) return { settled: 0, error: 'Fixture not found' };
    if (fixture.rows[0].status !== 'match finished') return { settled: 0, error: 'Match not finished' };

    const stats = await pool.query(
      `SELECT
        COALESCE(SUM(fs.corners), 0) AS total_corners,
        COALESCE(SUM(fs.yellow_cards), 0) AS total_yellow_cards,
        COALESCE(SUM(fs.red_cards), 0) AS total_red_cards,
        COALESCE(SUM(fs.fouls), 0) AS total_fouls
      FROM fixture_stats fs
      WHERE fs.fixture_id = $1`,
      [fixtureId]
    );

    const s = stats.rows[0] || { total_corners: 0, total_yellow_cards: 0, total_red_cards: 0, total_fouls: 0 };
    const { home_score, away_score } = fixture.rows[0];
    const totalGoals = (home_score || 0) + (away_score || 0);
    const totalCorners = parseInt(s.total_corners) || 0;
    const totalYellowCards = parseInt(s.total_yellow_cards) || 0;
    const totalRedCards = parseInt(s.total_red_cards) || 0;
    const totalFouls = parseInt(s.total_fouls) || 0;
    const bothScored = (home_score || 0) > 0 && (away_score || 0) > 0;

    const results = {
      goals:        (line) => totalGoals > line ? 'over' : totalGoals < line ? 'under' : 'push',
      both_score:   () => bothScored ? 'yes' : 'no',
      corners:      (line) => totalCorners > line ? 'over' : totalCorners < line ? 'under' : 'push',
      yellow_cards: (line) => totalYellowCards > line ? 'over' : totalYellowCards < line ? 'under' : 'push',
      red_card:     () => totalRedCards > 0 ? 'yes' : 'no',
      fouls:        (line) => totalFouls > line ? 'over' : totalFouls < line ? 'under' : 'push',
    };

    const predictions = await this.getByFixture(fixtureId);
    let settled = 0;

    for (const pred of predictions) {
      const resolver = results[pred.market];
      if (!resolver) continue;

      let correct = null;
      if (pred.market === 'both_score' || pred.market === 'red_card') {
        correct = pred.prediction === resolver();
      } else {
        const result = resolver(pred.line ? parseFloat(pred.line) : null);
        if (pred.prediction === 'exact') {
          correct = result === 'push';
        } else if (result === 'push') {
          correct = null;
        } else {
          correct = pred.prediction === result;
        }
      }

      const points = correct === true ? 10 : 0;
      await pool.query(
        `UPDATE predictions SET settled = TRUE, is_correct = $1, points = $2
         WHERE id = $3`,
        [correct, points, pred.id]
      );
      settled++;
    }

    return { settled, fixtureId };
  }
}

module.exports = new PredictionRepo();
