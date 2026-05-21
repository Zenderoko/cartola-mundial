const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const BASE_PRICES = {
  Goalkeeper: 5.0,
  Defender: 5.0,
  Midfielder: 6.0,
  Attacker: 8.0,
};

const PRICE_RANGES = {
  Goalkeeper: { min: 4.0, max: 7.0 },
  Defender: { min: 3.5, max: 7.5 },
  Midfielder: { min: 4.5, max: 9.0 },
  Attacker: { min: 5.0, max: 12.0 },
};

class PricingService {

  async calculatePrice(playerId) {
    const player = await pool.query(
      `SELECT p.position, p.id,
        COALESCE(AVG(ps.rating), 0) AS avg_rating,
        COALESCE(SUM(ps.goals), 0) AS total_goals,
        COALESCE(SUM(ps.assists), 0) AS total_assists,
        COALESCE(COUNT(ps.id), 0) AS matches_played
      FROM players p
      LEFT JOIN player_stats ps ON ps.player_id = p.id
      JOIN fixtures f ON f.id = ps.fixture_id AND f.status = 'match finished'
      WHERE p.id = $1
      GROUP BY p.id, p.position`,
      [playerId]
    );
    if (!player.rows[0]) return BASE_PRICES[player.position] || 5.0;

    const { position, avg_rating, total_goals, total_assists, matches_played } = player.rows[0];
    const base = BASE_PRICES[position] || 5.0;
    const range = PRICE_RANGES[position] || { min: 3.0, max: 10.0 };

    let ratingBonus = 0;
    if (matches_played > 0 && avg_rating > 0) {
      ratingBonus = ((avg_rating - 6.5) / 1.5) * 1.5;
    }

    let statsBonus = 0;
    if (position === 'Attacker' || position === 'Midfielder') {
      statsBonus = (total_goals * 0.5 + total_assists * 0.3);
    } else if (position === 'Goalkeeper') {
      statsBonus = matches_played > 0 ? (matches_played * 0.2) : 0;
    }

    let price = base + ratingBonus + statsBonus;
    price = Math.round(Math.max(range.min, Math.min(range.max, price)) * 10) / 10;

    return price;
  }

  async updateAllPrices() {
    const players = await pool.query('SELECT id, position FROM players');
    let updated = 0;

    for (const player of players.rows) {
      const price = await this.calculatePrice(player.id);
      await pool.query(
        `INSERT INTO player_prices (player_id, price, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (player_id) DO UPDATE SET price = $2, updated_at = NOW()`,
        [player.id, price]
      );
      updated++;
    }

    logger.info({ updated }, 'Player prices updated');
    return { updated };
  }

  async getPlayerPrices(teamId = null) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (teamId) {
      conditions.push(`p.team_id = $${idx}`);
      params.push(teamId);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT p.id AS player_id, p.name AS player_name, p.position, p.photo,
        t.name AS team_name, t.logo AS team_logo,
        COALESCE(pp.price, 5.0) AS price,
        COALESCE(tps.goals, 0) AS goals,
        COALESCE(tps.assists, 0) AS assists,
        tps.avg_rating AS rating,
        COALESCE(tps.appearances, 0) AS appearances
      FROM players p
      JOIN teams t ON t.id = p.team_id
      LEFT JOIN player_prices pp ON pp.player_id = p.id
      LEFT JOIN (
        SELECT ps.player_id,
          SUM(ps.goals) AS goals, SUM(ps.assists) AS assists,
          AVG(ps.rating) FILTER (WHERE ps.rating IS NOT NULL) AS avg_rating,
          COUNT(DISTINCT ps.fixture_id) AS appearances
        FROM player_stats ps
        JOIN fixtures f ON f.id = ps.fixture_id
        WHERE f.status = 'match finished'
        GROUP BY ps.player_id
      ) tps ON tps.player_id = p.id
      ${where}
      ORDER BY price DESC, p.name ASC`,
      params
    );
    return result.rows;
  }
}

module.exports = new PricingService();
