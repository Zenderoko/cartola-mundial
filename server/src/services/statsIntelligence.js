const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class StatsIntelligence {

  async getTeamAnalysis(teamId) {
    const stats = await pool.query(
      `SELECT
        COUNT(DISTINCT f.id) AS played,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score > f.away_score)
             OR (f.away_team_id = $1 AND f.away_score > f.home_score)
        ) AS wins,
        COUNT(DISTINCT f.id) FILTER (WHERE f.home_score = f.away_score
          AND (f.home_team_id = $1 OR f.away_team_id = $1)) AS draws,
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
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score > 0 AND f.away_score > 0)
             OR (f.away_team_id = $1 AND f.away_score > 0 AND f.home_score > 0)
        ) AS btts_matches,
        COUNT(DISTINCT f.id) FILTER (
          WHERE (f.home_team_id = $1 AND f.home_score + f.away_score > 2)
             OR (f.away_team_id = $1 AND f.away_score + f.home_score > 2)
        ) AS over_25_matches,
        COALESCE(AVG(fs.possession), 0) AS avg_possession,
        COALESCE(AVG(fs.shots_on_target), 0) AS avg_shots_on_target,
        COALESCE(AVG(fs.corners), 0) AS avg_corners,
        COALESCE(AVG(fs.yellow_cards + fs.red_cards), 0) AS avg_cards,
        COALESCE(SUM(ps.goals), 0) AS player_goals,
        COALESCE(SUM(ps.assists), 0) AS player_assists
      FROM fixtures f
      LEFT JOIN fixture_stats fs ON fs.fixture_id = f.id AND fs.team_id = $1
      LEFT JOIN player_stats ps ON ps.fixture_id = f.id AND ps.team_id = $1
      WHERE (f.home_team_id = $1 OR f.away_team_id = $1)
        AND f.status = 'match finished'`,
      [teamId]
    );

    const d = stats.rows[0];
    if (!d || !parseInt(d.played)) return null;

    const played = parseInt(d.played);
    const gf = parseInt(d.goals_for);
    const ga = parseInt(d.goals_against);
    const cs = parseInt(d.clean_sheets);
    const btts = parseInt(d.btts_matches);
    const ov25 = parseInt(d.over_25_matches);

    const avgGoalsFor = played > 0 ? +(gf / played).toFixed(2) : 0;
    const avgGoalsAgainst = played > 0 ? +(ga / played).toFixed(2) : 0;
    const avgCorners = +parseFloat(d.avg_corners || 0).toFixed(1);
    const avgShotsOT = +parseFloat(d.avg_shots_on_target || 0).toFixed(1);
    const avgPossession = +parseFloat(d.avg_possession || 0).toFixed(1);
    const avgCards = +parseFloat(d.avg_cards || 0).toFixed(2);
    const csPct = played > 0 ? +((cs / played) * 100).toFixed(1) : 0;
    const bttsPct = played > 0 ? +((btts / played) * 100).toFixed(1) : 0;
    const over25Pct = played > 0 ? +((ov25 / played) * 100).toFixed(1) : 0;
    const winPct = played > 0 ? +((parseInt(d.wins) / played) * 100).toFixed(1) : 0;

    const offensiveIndex = +(
      (avgGoalsFor * 12) +
      (avgShotsOT * 1.5) +
      (avgPossession / 8) +
      (avgCorners * 0.8)
    ).toFixed(1);

    const defensiveIndex = +(
      (csPct * 0.8) +
      ((played > 0 ? Math.max(0, (2 - avgGoalsAgainst)) * 15 : 0)) +
      (parseInt(d.wins) > 0 ? (parseInt(d.clean_sheets) / parseInt(d.wins)) * 10 : 0)
    ).toFixed(1);

    const formIndex = await this._calculateFormIndex(teamId);

    return {
      team_id: teamId,
      stats: {
        played, wins: parseInt(d.wins), draws: parseInt(d.draws), losses: parseInt(d.losses),
        goals_for: gf, goals_against: ga, goal_difference: gf - ga,
      },
      averages: {
        goals_for: avgGoalsFor,
        goals_against: avgGoalsAgainst,
        corners: avgCorners,
        shots_on_target: avgShotsOT,
        possession: avgPossession,
        cards: avgCards,
      },
      percentages: {
        wins: winPct,
        clean_sheets: csPct,
        btts: bttsPct,
        over_2_5: over25Pct,
      },
      indexes: {
        offensive: offensiveIndex,
        defensive: defensiveIndex,
        form: formIndex,
      },
    };
  }

  async _calculateFormIndex(teamId) {
    const last5 = await pool.query(
      `SELECT f.id, f.home_team_id, f.away_team_id,
        f.home_score, f.away_score, f.date
      FROM fixtures f
      WHERE (f.home_team_id = $1 OR f.away_team_id = $1)
        AND f.status = 'match finished'
      ORDER BY f.date DESC
      LIMIT 5`,
      [teamId]
    );

    if (last5.rows.length === 0) return 50;

    let score = 0;
    for (const m of last5.rows) {
      const isHome = m.home_team_id === teamId;
      const gf = isHome ? m.home_score : m.away_score;
      const ga = isHome ? m.away_score : m.home_score;

      if (gf > ga) score += 20;
      else if (gf === ga) score += 10;
      else score += 2;

      score += gf * 2;
      if (ga === 0) score += 5;
    }

    return Math.min(100, Math.round(score / last5.rows.length));
  }

  async getPlayerAnalysis(playerId) {
    const stats = await pool.query(
      `SELECT
        COUNT(DISTINCT ps.fixture_id) AS appearances,
        COALESCE(AVG(ps.rating), 0) AS avg_rating,
        COALESCE(SUM(ps.goals), 0) AS goals,
        COALESCE(SUM(ps.assists), 0) AS assists,
        COALESCE(SUM(ps.shots), 0) AS shots,
        COALESCE(SUM(ps.shots_on_target), 0) AS shots_on_target,
        COALESCE(SUM(ps.key_passes), 0) AS key_passes,
        COALESCE(SUM(ps.passes), 0) AS passes,
        COALESCE(SUM(ps.tackles), 0) AS tackles,
        COALESCE(SUM(ps.interceptions), 0) AS interceptions,
        COALESCE(SUM(ps.clearances), 0) AS clearances,
        COALESCE(SUM(ps.fouls), 0) AS fouls,
        COALESCE(SUM(ps.fouls_drawn), 0) AS fouls_drawn,
        COALESCE(SUM(ps.offsides), 0) AS offsides,
        COALESCE(COUNT(*) FILTER (WHERE ps.yellow_card), 0) AS yellow_cards,
        COALESCE(COUNT(*) FILTER (WHERE ps.red_card), 0) AS red_cards,
        COALESCE(SUM(ps.saves), 0) AS saves,
        COALESCE(SUM(ps.goals_conceded), 0) AS goals_conceded,
        COALESCE(COUNT(*) FILTER (WHERE ps.man_of_the_match), 0) AS man_of_the_match,
        p.position, p.name
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      JOIN fixtures f ON f.id = ps.fixture_id
      WHERE ps.player_id = $1 AND f.status = 'match finished'
      GROUP BY p.position, p.name`,
      [playerId]
    );

    const d = stats.rows[0];
    if (!d || !parseInt(d.appearances)) return null;

    const apps = parseInt(d.appearances);
    const pos = d.position;
    const goals = parseInt(d.goals);
    const assists = parseInt(d.assists);
    const shotsOT = parseInt(d.shots_on_target);
    const keyPasses = parseInt(d.key_passes);
    const tackles = parseInt(d.tackles);
    const saves = parseInt(d.saves);
    const motm = parseInt(d.man_of_the_match);
    const avgRating = +parseFloat(d.avg_rating).toFixed(2);

    const goalsPer90 = apps > 0 ? +(goals / apps * 90 / 90).toFixed(2) : 0;
    const assistsPer90 = apps > 0 ? +(assists / apps).toFixed(2) : 0;
    const shotsOTPer90 = apps > 0 ? +(shotsOT / apps).toFixed(2) : 0;
    const keyPassesPer90 = apps > 0 ? +(keyPasses / apps).toFixed(2) : 0;
    const tacklesPer90 = apps > 0 ? +(tackles / apps).toFixed(2) : 0;

    let score = 0;
    if (pos === 'Goalkeeper') {
      const savesPer90 = apps > 0 ? +(saves / apps).toFixed(2) : 0;
      const gcPer90 = apps > 0 ? +(parseInt(d.goals_conceded) / apps).toFixed(2) : 0;
      score = (avgRating * 8) + (savesPer90 * 3) + (motm * 5) - (gcPer90 * 2);
    } else if (pos === 'Defender') {
      const clearancesPer90 = apps > 0 ? +(parseInt(d.clearances) / apps).toFixed(2) : 0;
      score = (avgRating * 8) + (tacklesPer90 * 2) + (clearancesPer90 * 1.5) + (motm * 5)
        - (parseInt(d.yellow_cards) * 3) - (parseInt(d.red_cards) * 8);
    } else if (pos === 'Midfielder') {
      score = (avgRating * 8) + (goalsPer90 * 10) + (assistsPer90 * 6)
        + (keyPassesPer90 * 3) + (tacklesPer90 * 2) + (motm * 5);
    } else {
      score = (avgRating * 8) + (goalsPer90 * 12) + (assistsPer90 * 7)
        + (shotsOTPer90 * 3) + (motm * 5);
    }

    return {
      player_id: playerId,
      position: pos,
      appearances: apps,
      per_game: {
        rating: avgRating,
        goals: goalsPer90,
        assists: assistsPer90,
        shots_on_target: shotsOTPer90,
        key_passes: keyPassesPer90,
        tackles: tacklesPer90,
      },
      totals: {
        goals, assists, shots_on_target: shotsOT,
        key_passes: keyPasses, tackles,
        saves, man_of_the_match: motm,
        yellow_cards: parseInt(d.yellow_cards),
        red_cards: parseInt(d.red_cards),
      },
      intelligence_score: +score.toFixed(1),
    };
  }

  async getMatchPrediction(homeTeamId, awayTeamId) {
    const [home, away, h2h] = await Promise.all([
      this.getTeamAnalysis(homeTeamId),
      this.getTeamAnalysis(awayTeamId),
      this._getHeadToHead(homeTeamId, awayTeamId),
    ]);

    if (!home || !away) return null;

    const homeAdvantage = 5;
    const homeScore = home.indexes.offensive + home.indexes.form + homeAdvantage - away.indexes.defensive;
    const awayScore = away.indexes.offensive + away.indexes.form - home.indexes.defensive;

    const total = homeScore + awayScore;
    const homeWinPct = total > 0 ? +((homeScore / total) * 100).toFixed(1) : 50;
    const awayWinPct = total > 0 ? +((awayScore / total) * 100).toFixed(1) : 50;
    const drawPct = +(100 - homeWinPct - awayWinPct).toFixed(1);

    const avgGoals = +((home.averages.goals_for + away.averages.goals_for) / 2).toFixed(2);
    const bttsProb = +((home.percentages.btts + away.percentages.btts) / 2).toFixed(1);
    const over25Prob = +((home.percentages.over_2_5 + away.percentages.over_2_5) / 2).toFixed(1);

    return {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      prediction: {
        home_win: homeWinPct,
        draw: drawPct,
        away_win: awayWinPct,
        likely_result: homeWinPct > awayWinPct ? '1' : homeWinPct < awayWinPct ? '2' : 'X',
      },
      probabilities: {
        btts: bttsProb,
        over_2_5: over25Prob,
        expected_goals: avgGoals,
      },
      analysis: {
        home: home,
        away: away,
        head_to_head: h2h,
      },
    };
  }

  async _getHeadToHead(teamA, teamB) {
    const result = await pool.query(
      `SELECT home_team_id, away_team_id, home_score, away_score, date, round
      FROM fixtures
      WHERE ((home_team_id = $1 AND away_team_id = $2)
          OR (home_team_id = $2 AND away_team_id = $1))
        AND status = 'match finished'
      ORDER BY date DESC
      LIMIT 10`,
      [teamA, teamB]
    );

    if (result.rows.length === 0) return null;

    let aWins = 0, bWins = 0, draws = 0;
    for (const m of result.rows) {
      if (m.home_score > m.away_score) {
        if (m.home_team_id === teamA) aWins++;
        else bWins++;
      } else if (m.home_score < m.away_score) {
        if (m.away_team_id === teamA) aWins++;
        else bWins++;
      } else draws++;
    }

    return {
      matches: result.rows.length,
      team_a_wins: aWins,
      team_b_wins: bWins,
      draws,
      recent: result.rows.slice(0, 5).map((m) => ({
        home_score: m.home_score,
        away_score: m.away_score,
        date: m.date,
        round: m.round,
      })),
    };
  }

  async getTopTeamsByIndex(limit = 10) {
    const teams = await pool.query('SELECT id FROM teams');
    const results = [];

    for (const t of teams.rows) {
      try {
        const analysis = await this.getTeamAnalysis(t.id);
        if (analysis) {
          const globalScore = +(
            analysis.indexes.offensive * 0.35 +
            analysis.indexes.defensive * 0.30 +
            analysis.indexes.form * 0.25 +
            analysis.percentages.wins * 0.10
          ).toFixed(1);
          results.push({ team_id: t.id, ...analysis, global_score: globalScore });
        }
      } catch { /* skip */ }
    }

    results.sort((a, b) => b.global_score - a.global_score);
    return results.slice(0, limit).map((r, i) => ({ position: i + 1, ...r }));
  }

  async getTopPlayersByScore(limit = 20, position = null) {
    const players = await pool.query(
      `SELECT id FROM players${position ? " WHERE position = $1" : ""}`,
      position ? [position] : []
    );
    const results = [];

    for (const p of players.rows) {
      try {
        const analysis = await this.getPlayerAnalysis(p.id);
        if (analysis && analysis.intelligence_score > 0) {
          results.push({ player_id: p.id, ...analysis });
        }
      } catch { /* skip */ }
    }

    results.sort((a, b) => b.intelligence_score - a.intelligence_score);
    return results.slice(0, limit).map((r, i) => ({ position: i + 1, ...r }));
  }

  async getTournamentSnapshot() {
    const totalMatches = await pool.query(
      "SELECT COUNT(*) FROM fixtures WHERE status = 'match finished'"
    );
    const totalGoals = await pool.query(
      `SELECT COALESCE(SUM(home_score + away_score), 0) AS goals
       FROM fixtures WHERE status = 'match finished'`
    );
    const totalCards = await pool.query(
      `SELECT COALESCE(SUM(yellow_cards + red_cards), 0) AS cards
       FROM fixture_stats fs
       JOIN fixtures f ON f.id = fs.fixture_id
       WHERE f.status = 'match finished'`
    );
    const topTeam = await pool.query(
      `SELECT t.id, t.name, t.logo,
        SUM(CASE WHEN f.home_team_id = t.id THEN f.home_score ELSE f.away_score END) AS goals
      FROM teams t
      JOIN fixtures f ON f.home_team_id = t.id OR f.away_team_id = t.id
      WHERE f.status = 'match finished'
      GROUP BY t.id, t.name, t.logo
      ORDER BY goals DESC LIMIT 1`
    );

    const played = parseInt(totalMatches.rows[0].count);
    const goals = parseInt(totalGoals.rows[0].goals);

    return {
      tournament: {
        matches_played: played,
        total_goals: goals,
        avg_goals_per_match: played > 0 ? +(goals / played).toFixed(2) : 0,
        total_cards: parseInt(totalCards.rows[0].cards),
      },
      top_scoring_team: topTeam.rows[0] || null,
      generated_at: new Date().toISOString(),
    };
  }
}

module.exports = new StatsIntelligence();
