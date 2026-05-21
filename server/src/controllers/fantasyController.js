const fantasyRepo = require('../repositories/fantasyRepo');
const pricingService = require('../services/pricingService');
const { success, error, paginated } = require('../utils/response');

async function getMyTeam(req, res, next) {
  try {
    if (!req.user) return error(res, 404, 'NO_TEAM', 'You have not created a fantasy team yet');

    const team = await fantasyRepo.getTeam(req.user.clerk_user_id);
    if (!team) return error(res, 404, 'NO_TEAM', 'You have not created a fantasy team yet');

    const teamWithPicks = await fantasyRepo.getTeam(team.clerk_user_id);
    if (!teamWithPicks) return error(res, 404, 'NOT_FOUND', 'Team not found');

    const totalSpent = teamWithPicks.picks.reduce((sum, p) => sum + (p.price || 5.0), 0);

    return success(res, {
      ...teamWithPicks,
      budget_spent: totalSpent,
      budget_remaining: Math.round((100.0 - totalSpent) * 10) / 10,
    }, { picks_count: teamWithPicks.picks.length });
  } catch (err) {
    next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { name, formation, picks } = req.body;
    const clerkUserId = req.user.clerk_user_id;

    const existingTeam = await fantasyRepo.getTeam(clerkUserId);
    if (existingTeam) {
      return error(res, 409, 'TEAM_EXISTS', 'You already have an active team. Update it instead.');
    }

    const currentRound = await fantasyRepo.getCurrentRound();

    const team = await fantasyRepo.createTeam(clerkUserId, name, formation);
    await fantasyRepo.savePicks(team.id, picks, currentRound);
    await fantasyRepo.deactivateOtherTeams(clerkUserId, team.id);

    const teamWithPicks = await fantasyRepo.getTeam(team.clerk_user_id);
    return success(res, teamWithPicks, { round: currentRound });
  } catch (err) {
    next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const { name, formation, picks } = req.body;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.updateTeam(id, clerkUserId, { name, formation });
    if (!team) return error(res, 404, 'NOT_FOUND', 'Team not found or not yours');

    if (picks) {
      const currentRound = await fantasyRepo.getCurrentRound();
      await fantasyRepo.savePicks(id, picks, currentRound);
    }

    const teamWithPicks = await fantasyRepo.getTeam(clerkUserId);
    return success(res, teamWithPicks);
  } catch (err) {
    next(err);
  }
}

async function getPointsBreakdown(req, res, next) {
  try {
    const { id } = req.params;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.getTeam(clerkUserId);
    if (!team || team.id !== parseInt(id)) {
      return error(res, 403, 'FORBIDDEN', 'This team does not belong to you');
    }

    const breakdown = await fantasyRepo.getPointsBreakdown(id);
    return success(res, breakdown);
  } catch (err) {
    next(err);
  }
}

async function removePick(req, res, next) {
  try {
    const { id, playerId } = req.params;
    const clerkUserId = req.user.clerk_user_id;

    const team = await fantasyRepo.getTeam(clerkUserId);
    if (!team || team.id !== parseInt(id)) {
      return error(res, 403, 'FORBIDDEN', 'This team does not belong to you');
    }

    const currentRound = await fantasyRepo.getCurrentRound();
    const removed = await fantasyRepo.removePick(id, parseInt(playerId), currentRound);
    if (!removed) return error(res, 404, 'NOT_FOUND', 'Pick not found');

    return success(res, { removed: true });
  } catch (err) {
    next(err);
  }
}

async function getPrices(req, res, next) {
  try {
    const teamId = req.query.team_id ? parseInt(req.query.team_id) : null;
    const prices = await pricingService.getPlayerPrices(teamId);

    return success(res, prices, {
      budget: 100,
      currency: 'M',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function getBudgetRules(req, res, next) {
  try {
    return success(res, {
      budget: 100,
      currency: 'M',
      squad_size: 11,
      formations: ['4-3-3', '4-4-2', '3-4-3', '4-5-1', '3-5-2', '5-3-2', '4-2-3-1'],
      price_ranges: {
        Goalkeeper: { min: 4.0, max: 7.0, base: 5.0 },
        Defender:   { min: 3.5, max: 7.5, base: 5.0 },
        Midfielder: { min: 4.5, max: 9.0, base: 6.0 },
        Attacker:   { min: 5.0, max: 12.0, base: 8.0 },
      },
      multipliers: {
        captain: 2.0,
        vice_captain: 1.5,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyTeam, createTeam, updateTeam,
  getPointsBreakdown, removePick,
  getPrices, getBudgetRules,
};
