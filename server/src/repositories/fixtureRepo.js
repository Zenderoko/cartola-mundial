const { pool } = require('../config/database');

class FixtureRepo {
  async findAll({ date, team_id, round, status, stage, search, page = 1, perPage = 20, sort = 'date_asc' }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (date) {
      conditions.push(`DATE(f.date AT TIME ZONE 'UTC') = DATE($${paramIndex})`);
      params.push(date);
      paramIndex++;
    }
    if (team_id) {
      conditions.push(`(f.home_team_id = $${paramIndex} OR f.away_team_id = $${paramIndex})`);
      params.push(team_id);
      paramIndex++;
    }
    if (round) {
      conditions.push(`f.round = $${paramIndex}`);
      params.push(round);
      paramIndex++;
    }
    if (status) {
      conditions.push(`f.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (stage) {
      conditions.push(`f.stage = $${paramIndex}`);
      params.push(stage);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(ht.name ILIKE $${paramIndex} OR at.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap = {
      date_asc: 'f.date ASC',
      date_desc: 'f.date DESC',
      round_asc: 'f.round ASC, f.date ASC',
      round_desc: 'f.round DESC, f.date DESC',
    };
    const orderBy = orderMap[sort] || orderMap.date_asc;

    const offset = (page - 1) * perPage;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM fixtures f
       LEFT JOIN teams ht ON ht.id = f.home_team_id
       LEFT JOIN teams at ON at.id = f.away_team_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT
        f.id, f.round, f.date, f.status,
        f.home_score, f.away_score, f.venue, f.stage,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, perPage, offset]
    );

    return { rows: result.rows, total };
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT
        f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code, 'group_name', ht.group_name) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code, 'group_name', at.group_name) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findLive() {
    const result = await pool.query(
      `SELECT
        f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.status IN ('live', '1H', '2H', 'HT', 'ET', 'PEN', 'LIVE')
      ORDER BY f.date ASC`
    );
    return result.rows;
  }

  async findRecentFinished(hours = 2) {
    const result = await pool.query(
      `SELECT
        f.*,
        jsonb_build_object('id', ht.id, 'name', ht.name, 'logo', ht.logo, 'code', ht.code) AS home_team,
        jsonb_build_object('id', at.id, 'name', at.name, 'logo', at.logo, 'code', at.code) AS away_team
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id = f.home_team_id
      LEFT JOIN teams at ON at.id = f.away_team_id
      WHERE f.status = 'match finished'
        AND f.updated_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY f.date DESC`
    );
    return result.rows;
  }

  async findScheduledBefore(date) {
    const result = await pool.query(
      `SELECT id, status FROM fixtures
       WHERE status IN ('scheduled', 'time-to-be-defined')
         AND date <= $1
       ORDER BY date ASC`,
      [date.toISOString()]
    );
    return result.rows;
  }

  async upsert(fixture) {
    const f = fixture.fixture;
    const teams = fixture.teams;
    const goals = fixture.goals;
    const statusMap = {
      'TBD': 'time-to-be-defined', 'NS': 'scheduled',
      '1H': '1H', 'HT': 'HT', '2H': '2H', 'ET': 'ET', 'BT': 'BT',
      'P': 'PEN', 'SUSP': 'suspended', 'INT': 'interrupted',
      'FT': 'match finished', 'AET': 'match finished', 'PEN': 'match finished',
      'CANC': 'cancelled', 'ABD': 'abandoned', 'AWD': 'awarded',
      'WO': 'walkover', 'LIVE': 'live',
    };

    const apiStatus = f.status?.short || 'NS';
    const mappedStatus = statusMap[apiStatus] || apiStatus?.toLowerCase() || 'scheduled';

    const ttl = mappedStatus === 'match finished' ? "'30 days'" : "'6 hours'";

    const result = await pool.query(
      `INSERT INTO fixtures (id, round, date, status, home_team_id, away_team_id,
         home_score, away_score, venue, stage, cache_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL ${ttl})
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         home_score = EXCLUDED.home_score,
         away_score = EXCLUDED.away_score,
         round = EXCLUDED.round,
         date = EXCLUDED.date,
         venue = EXCLUDED.venue,
         stage = EXCLUDED.stage,
         updated_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [
        f.id, f.round?.name || null, f.date, mappedStatus,
        teams.home.id, teams.away.id,
        goals.home, goals.away,
        f.venue?.name || null, f.round?.name || null,
      ]
    );
    return { action: result.rows[0]?.inserted ? 'inserted' : 'updated' };
  }

  async upsertMany(fixtures) {
    let inserted = 0, updated = 0;
    for (const fixture of fixtures) {
      const result = await this.upsert(fixture);
      if (result.action === 'inserted') inserted++;
      else updated++;
    }
    return { inserted, updated };
  }

  async updateStatus(id, status) {
    await pool.query(
      'UPDATE fixtures SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  }

  async getFixtureStats(id) {
    const result = await pool.query(
      `SELECT fs.*,
        jsonb_build_object('id', t.id, 'name', t.name, 'logo', t.logo) AS team
      FROM fixture_stats fs
      JOIN teams t ON t.id = fs.team_id
      WHERE fs.fixture_id = $1
      ORDER BY fs.team_id`,
      [id]
    );
    return result.rows;
  }

  async getPlayerStats(id, limit = 10) {
    const result = await pool.query(
      `SELECT ps.id, ps.player_id, ps.team_id, ps.rating, ps.minutes_played, ps.goals,
        ps.assists, ps.shots, ps.key_passes, ps.tackles, ps.saves,
        ps.man_of_the_match, ps.yellow_card, ps.red_card,
        p.name AS player_name, p.position, p.photo, p.number,
        t.name AS team_name, t.logo AS team_logo
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = ps.team_id
      WHERE ps.fixture_id = $1
      ORDER BY ps.rating DESC NULLS LAST
      LIMIT $2`,
      [id, limit]
    );
    return result.rows;
  }

  async getFixtureEvents(id) {
    const result = await pool.query(
      `SELECT fe.*,
        p.name AS player_name,
        a.name AS assist_name,
        t.name AS team_name, t.logo AS team_logo
      FROM fixture_events fe
      LEFT JOIN players p ON p.id = fe.player_id
      LEFT JOIN players a ON a.id = fe.assist_id
      JOIN teams t ON t.id = fe.team_id
      WHERE fe.fixture_id = $1
      ORDER BY fe.minute ASC, fe.extra_minute ASC`,
      [id]
    );
    return result.rows;
  }

  async getPlayerStatsByFixture(fixtureId) {
    const result = await pool.query(
      `SELECT
        ps.team_id, t.name AS team_name, t.logo AS team_logo,
        jsonb_agg(
          jsonb_build_object(
            'player_id', ps.player_id,
            'player_name', p.name,
            'position', ps.position,
            'photo', p.photo,
            'number', p.number,
            'rating', ps.rating,
            'minutes_played', ps.minutes_played,
            'goals', ps.goals,
            'assists', ps.assists,
            'shots', ps.shots,
            'shots_on_target', ps.shots_on_target,
            'key_passes', ps.key_passes,
            'passes', ps.passes,
            'accurate_passes', ps.accurate_passes,
            'tackles', ps.tackles,
            'interceptions', ps.interceptions,
            'fouls', ps.fouls,
            'fouls_drawn', ps.fouls_drawn,
            'yellow_card', ps.yellow_card,
            'red_card', ps.red_card,
            'saves', ps.saves,
            'goals_conceded', ps.goals_conceded,
            'man_of_the_match', ps.man_of_the_match
          ) ORDER BY ps.rating DESC NULLS LAST
        ) AS players
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = ps.team_id
      WHERE ps.fixture_id = $1
      GROUP BY ps.team_id, t.name, t.logo
      ORDER BY t.name`,
      [fixtureId]
    );
    return result.rows;
  }

  async getFixtureStatsByFixture(fixtureId) {
    return this.getFixtureStats(fixtureId);
  }

  async getEventsByFixture(fixtureId) {
    const result = await pool.query(
      `SELECT fe.minute, fe.extra_minute, fe.event_type, fe.detail, fe.comments,
        jsonb_build_object('id', fe.player_id, 'name', p.name, 'photo', p.photo) AS player,
        jsonb_build_object('id', fe.assist_id, 'name', a.name) AS assist,
        jsonb_build_object('id', t.id, 'name', t.name, 'logo', t.logo) AS team
      FROM fixture_events fe
      LEFT JOIN players p ON p.id = fe.player_id
      LEFT JOIN players a ON a.id = fe.assist_id
      JOIN teams t ON t.id = fe.team_id
      WHERE fe.fixture_id = $1
      ORDER BY fe.minute ASC, fe.extra_minute ASC`,
      [fixtureId]
    );
    return result.rows;
  }

  async getManOfTheMatch(fixtureId) {
    const result = await pool.query(
      `SELECT p.id AS player_id, p.name AS player_name, p.photo,
        t.name AS team_name, t.logo AS team_logo, ps.rating
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN teams t ON t.id = ps.team_id
      WHERE ps.fixture_id = $1 AND ps.man_of_the_match = true
      LIMIT 1`,
      [fixtureId]
    );
    return result.rows[0] || null;
  }

  async getDistinctRounds() {
    const result = await pool.query(
      `SELECT DISTINCT round, stage FROM fixtures
       WHERE round IS NOT NULL
       ORDER BY round`
    );
    return result.rows.map((r) => r.round);
  }

  async getDailyFixtureCount(date) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM fixtures WHERE DATE(date AT TIME ZONE 'UTC') = DATE($1)`,
      [date]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new FixtureRepo();
