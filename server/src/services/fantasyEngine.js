const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

class FantasyEngine {
  RULES = {
    goals: 8,
    assists: 5,
    clean_sheet: 6,
    every_3_saves: 3,
    key_passes_3plus: 3,
    yellow_card: -2,
    red_card: -5,
    goal_conceded: -2,
    missed_penalty: -3,
    man_of_match: 5,
    rating_ge_8: 4,
    rating_le_5: -3,
    captain_mult: 2,
    vice_mult: 1.5,
  };

  async calculatePoints(fixtureId) {
    const fixture = await pool.query(
      'SELECT id, round FROM fixtures WHERE id = $1', [fixtureId]
    );
    if (!fixture.rows[0]) throw new Error('Fixture not found');
    const round = fixture.rows[0].round;

    const players = await pool.query(`
      SELECT ps.*, p.position
      FROM player_stats ps
      JOIN players p ON p.id = ps.player_id
      WHERE ps.fixture_id = $1
    `, [fixtureId]);

    for (const player of players.rows) {
      const breakdown = {};
      let basePoints = 0;

      if (player.goals > 0) {
        const pts = player.goals * this.RULES.goals;
        basePoints += pts;
        breakdown.goals = pts;
      }

      if (player.assists > 0) {
        const pts = player.assists * this.RULES.assists;
        basePoints += pts;
        breakdown.assists = pts;
      }

      if (player.minutes_played >= 60
          && (player.position === 'Goalkeeper' || player.position === 'Defender')
          && player.goals_conceded === 0) {
        basePoints += this.RULES.clean_sheet;
        breakdown.clean_sheet = this.RULES.clean_sheet;
      }

      if (player.position === 'Goalkeeper' && player.saves >= 3) {
        const pts = Math.floor(player.saves / 3) * this.RULES.every_3_saves;
        basePoints += pts;
        breakdown.saves = pts;
      }

      if (player.key_passes >= 3) {
        basePoints += this.RULES.key_passes_3plus;
        breakdown.key_passes_bonus = this.RULES.key_passes_3plus;
      }

      if (player.yellow_card) {
        basePoints += this.RULES.yellow_card;
        breakdown.yellow_card = this.RULES.yellow_card;
      }
      if (player.red_card) {
        basePoints += this.RULES.red_card;
        breakdown.red_card = this.RULES.red_card;
      }

      if ((player.position === 'Goalkeeper' || player.position === 'Defender')
          && player.goals_conceded > 0) {
        const pts = player.goals_conceded * this.RULES.goal_conceded;
        basePoints += pts;
        breakdown.goals_conceded = pts;
      }

      if (player.penalties_missed > 0) {
        const pts = player.penalties_missed * this.RULES.missed_penalty;
        basePoints += pts;
        breakdown.missed_penalty = pts;
      }

      if (player.man_of_the_match) {
        basePoints += this.RULES.man_of_match;
        breakdown.man_of_match = this.RULES.man_of_match;
      }

      if (player.rating >= 8.0) {
        basePoints += this.RULES.rating_ge_8;
        breakdown.rating_bonus = this.RULES.rating_ge_8;
      } else if (player.rating <= 5.0 && player.rating > 0) {
        basePoints += this.RULES.rating_le_5;
        breakdown.rating_penalty = this.RULES.rating_le_5;
      }

      await pool.query(`
        INSERT INTO fantasy_points (player_id, fixture_id, round, base_points, breakdown)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (player_id, fixture_id)
        DO UPDATE SET base_points = EXCLUDED.base_points, breakdown = EXCLUDED.breakdown,
                      calculated_at = NOW()
      `, [player.player_id, fixtureId, round, basePoints, JSON.stringify(breakdown)]);
    }

    await this._applyCaptainMultipliers(fixtureId, round);
    await this._updateTeamTotals(round);

    const calculated = players.rows.length;
    logger.info({ fixtureId, round, calculated }, 'Fantasy points calculated');
    return { calculated };
  }

  async _applyCaptainMultipliers(fixtureId, round) {
    await pool.query(`
      UPDATE fantasy_points fp
      SET
        captain_bonus = CASE WHEN fp2.is_captain
          THEN fp.base_points * $1 ELSE 0 END,
        vice_bonus = CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
          THEN fp.base_points * $2 ELSE 0 END,
        total_points = fp.base_points
          + CASE WHEN fp2.is_captain THEN fp.base_points * $1 ELSE 0 END
          + CASE WHEN fp2.is_vice_captain AND NOT fp2.is_captain
              THEN fp.base_points * $2 ELSE 0 END
      FROM fantasy_picks fp2
      WHERE fp2.player_id = fp.player_id
        AND fp2.round = fp.round
        AND fp.fixture_id = $3
        AND fp.round = $4
    `, [this.RULES.captain_mult - 1, this.RULES.vice_mult - 1, fixtureId, round]);
  }

  async _updateTeamTotals(round) {
    await pool.query(`
      UPDATE fantasy_teams ft
      SET total_points = (
        SELECT COALESCE(SUM(fp.total_points), 0)
        FROM fantasy_picks fpk
        JOIN fantasy_points fp ON fp.player_id = fpk.player_id AND fp.round = fpk.round
        WHERE fpk.fantasy_team_id = ft.id
      ),
      round_points = (
        SELECT COALESCE(SUM(fp.total_points), 0)
        FROM fantasy_picks fpk
        JOIN fantasy_points fp ON fp.player_id = fpk.player_id AND fp.round = fpk.round
        WHERE fpk.fantasy_team_id = ft.id AND fp.round = $1
      ),
      updated_at = NOW()
    `, [round]);

    await pool.query(`
      UPDATE fantasy_picks fpk
      SET points_earned = (
        SELECT COALESCE(fp.total_points, 0)
        FROM fantasy_points fp
        WHERE fp.player_id = fpk.player_id AND fp.round = fpk.round
      )
      WHERE fpk.round = $1
    `, [round]);
  }
}

module.exports = new FantasyEngine();
