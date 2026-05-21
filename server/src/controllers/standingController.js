const standingRepo = require('../repositories/standingRepo');
const { success } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { group } = req.query;
    const standings = await standingRepo.findAll(group || undefined);
    return success(res, standings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll };
