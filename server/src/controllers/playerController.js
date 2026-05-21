const playerRepo = require('../repositories/playerRepo');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function getAll(req, res, next) {
  try {
    const { page, per_page, team_id, position, search, sort } = req.query;
    const { rows, total } = await playerRepo.findAll({
      team_id: team_id || undefined,
      position: position || undefined,
      search: search || undefined,
      sort, page, perPage: per_page,
    });
    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const player = await playerRepo.findById(id);
    if (!player) return error(res, 404, 'NOT_FOUND', `Player ${id} not found`);

    const [totals, matchHistory] = await Promise.all([
      playerRepo.getCareerTotals(id),
      playerRepo.getMatchHistory(id),
    ]);

    return success(res, {
      ...player,
      totals: totals ? {
        appearances: parseInt(totals.appearances),
        minutes_played: parseInt(totals.minutes_played),
        goals: parseInt(totals.goals), assists: parseInt(totals.assists),
        shots: parseInt(totals.shots), shots_on_target: parseInt(totals.shots_on_target),
        key_passes: parseInt(totals.key_passes), passes: parseInt(totals.passes),
        pass_accuracy: parseFloat(totals.pass_accuracy),
        tackles: parseInt(totals.tackles),
        fouls: parseInt(totals.fouls), fouls_drawn: parseInt(totals.fouls_drawn),
        yellow_cards: parseInt(totals.yellow_cards), red_cards: parseInt(totals.red_cards),
        man_of_the_match: parseInt(totals.man_of_the_match),
        average_rating: totals.average_rating ? parseFloat(totals.average_rating).toFixed(2) : null,
        saves: parseInt(totals.saves), goals_conceded: parseInt(totals.goals_conceded),
      } : null,
      match_history: matchHistory.map((m) => ({
        fixture_id: m.fixture_id, round: m.round, date: m.date,
        opponent: m.opponent, team_score: m.team_score, opponent_score: m.opponent_score,
        rating: m.rating, minutes_played: m.minutes_played, position: m.position,
        goals: m.goals, assists: m.assists, shots: m.shots, key_passes: m.key_passes,
        tackles: m.tackles, saves: m.saves,
        yellow_card: m.yellow_card, red_card: m.red_card, man_of_the_match: m.man_of_the_match,
      })),
    }, { matches_played: matchHistory.length });
  } catch (err) {
    next(err);
  }
}

async function getTop(req, res, next) {
  try {
    const { type, limit, team_id } = req.query;
    const teamFilter = team_id || undefined;

    const rankers = {
      goals: () => playerRepo.getTopByGoals(limit, teamFilter),
      assists: () => playerRepo.getTopByAssists(limit, teamFilter),
      rating: () => playerRepo.getTopByRating(limit, teamFilter),
      saves: () => playerRepo.getTopBySaves(limit, teamFilter),
      cards: () => playerRepo.getTopByCards(limit, teamFilter),
    };

    const data = await (rankers[type] || rankers.goals)();
    return success(res, data, { type, limit, total: data.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getTop };
