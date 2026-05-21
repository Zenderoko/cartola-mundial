const favoriteRepo = require('../repositories/favoriteRepo');
const { success, created, noContent, error } = require('../utils/response');

async function getAll(req, res, next) {
  try {
    const { type } = req.query;
    const favorites = await favoriteRepo.findAll(req.user.clerk_user_id, type || null);
    return success(res, favorites, { total: favorites.length });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { entity_type, entity_id } = req.body;
    if (!entity_type || !entity_id) {
      return error(res, 400, 'MISSING_PARAMS', 'entity_type and entity_id required');
    }
    const fav = await favoriteRepo.create(req.user.clerk_user_id, entity_type, entity_id);
    if (!fav) {
      return error(res, 409, 'ALREADY_EXISTS', 'Ya existe en favoritos');
    }
    return created(res, fav);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await favoriteRepo.delete(Number(id), req.user.clerk_user_id);
    if (!deleted) return error(res, 404, 'NOT_FOUND', 'Favorito no encontrado');
    return noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, remove };
