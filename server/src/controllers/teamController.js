const teamRepo = require('../repositories/teamRepo');
const { success, paginated, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { page, per_page, group, search } = req.query;
    const { rows, total } = await teamRepo.findAll({
      group: group || undefined,
      search: search || undefined,
      page,
      perPage: per_page,
    });
    return paginated(res, rows, { page, perPage: per_page, total });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const team = await teamRepo.findById(id);
    if (!team) return error(res, 404, 'NOT_FOUND', `Team ${id} not found`);

    const squad = await teamRepo.getSquad(id);
    return success(res, { ...team, squad }, { squad_size: squad.length });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const { id } = req.params;
    const team = await teamRepo.findById(id);
    if (!team) return error(res, 404, 'NOT_FOUND', `Team ${id} not found`);

    const [stats, topScorer, topAssist] = await Promise.all([
      teamRepo.getTeamStats(id),
      teamRepo.getTopScorer(id),
      teamRepo.getTopAssist(id),
    ]);

    if (!stats) {
      return success(res, {
        team_id: Number(id), team_name: team.name, logo: team.logo,
        played: 0, message: 'No matches played yet',
      });
    }

    return success(res, { ...stats, team_name: team.name, logo: team.logo, top_scorer: topScorer, top_assist: topAssist });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, getStats };
