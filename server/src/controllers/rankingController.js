const rankingRepo = require('../repositories/rankingRepo');
const { success, paginated, error } = require('../utils/response');

async function getGlobalRanking(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 100;
    const offset = (page - 1) * perPage;

    const { rows, total } = await rankingRepo.getGlobalRanking(perPage, offset);
    return paginated(res, rows, { page, perPage, total });
  } catch (err) {
    next(err);
  }
}

async function getRoundRanking(req, res, next) {
  try {
    const { round } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const ranking = await rankingRepo.getRoundRanking(parseInt(round), limit);
    return success(res, ranking, { round: parseInt(round), total: ranking.length });
  } catch (err) {
    next(err);
  }
}

async function getRounds(req, res, next) {
  try {
    const rounds = await rankingRepo.getDistinctRounds();
    return success(res, rounds);
  } catch (err) {
    next(err);
  }
}

async function getUserPosition(req, res, next) {
  try {
    if (!req.user) return error(res, 401, 'NO_AUTH', 'Authentication required');
    const position = await rankingRepo.getUserRankingPosition(req.user.clerk_user_id);
    return success(res, { position });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGlobalRanking, getRoundRanking, getRounds, getUserPosition };
