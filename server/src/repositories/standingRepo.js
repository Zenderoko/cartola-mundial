const { pool } = require('../config/database');

class StandingRepo {
  async findAll(groupFilter) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (groupFilter) {
      conditions.push(`s.group_name = $${idx}`);
      params.push(groupFilter);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT s.group_name, s.position, s.played, s.wins, s.draws, s.losses,
        s.gf, s.ga, s.gd, s.points, s.form,
        t.id AS team_id, t.name AS team_name, t.logo, t.code
      FROM standings s
      JOIN teams t ON t.id = s.team_id
      ${where}
      ORDER BY s.group_name, s.position ASC`,
      params
    );

    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.group_name]) grouped[row.group_name] = [];
      grouped[row.group_name].push({
        position: row.position,
        team_id: row.team_id,
        team_name: row.team_name,
        logo: row.logo,
        code: row.code,
        played: row.played,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goals_for: row.gf,
        goals_against: row.ga,
        goal_diff: row.gd,
        points: row.points,
        form: row.form,
      });
    }

    return Object.entries(grouped).map(([group_name, standings]) => ({
      group_name,
      standings,
    }));
  }

  async upsertMany(apiStandings) {
    let inserted = 0, updated = 0;
    for (const group of apiStandings) {
      for (const row of group) {
        const groupName = row.group?.name || group[0]?.group || 'Unknown';
        const result = await pool.query(
          `INSERT INTO standings (group_name, team_id, position, played,
             wins, draws, losses, gf, ga, gd, points, form, cache_until)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                  NOW() + INTERVAL '6 hours')
          ON CONFLICT (group_name, team_id) DO UPDATE SET
            position = EXCLUDED.position, played = EXCLUDED.played,
            wins = EXCLUDED.wins, draws = EXCLUDED.draws,
            losses = EXCLUDED.losses, gf = EXCLUDED.gf,
            ga = EXCLUDED.ga, gd = EXCLUDED.gd,
            points = EXCLUDED.points, form = EXCLUDED.form,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted`,
          [groupName, row.team.id, row.position, row.all?.played || 0,
           row.all?.win || 0, row.all?.draw || 0, row.all?.lose || 0,
           row.all?.goals?.for || 0, row.all?.goals?.against || 0,
           row.goalsDiff || 0, row.points || 0, row.form || null]
        );
        if (result.rows[0]?.inserted) inserted++;
        else updated++;
      }
    }
    return { inserted, updated };
  }
}

module.exports = new StandingRepo();
