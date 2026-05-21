const predictionRepo = require('../repositories/predictionRepo');
const { success, error } = require('../utils/response');

async function getMarkets(req, res, next) {
  try {
    const markets = predictionRepo.getMarkets();
    return success(res, Object.entries(markets).map(([key, m]) => ({ key, ...m })));
  } catch (err) {
    next(err);
  }
}

async function getUpcomingMatches(req, res, next) {
  try {
    const userId = req.user?.id;
    const matches = await predictionRepo.getUpcomingMatches(userId);

    const markets = predictionRepo.getMarkets();
    const data = matches.map(m => {
      const actualResult = m.actual_result;
      const matchMarkets = Object.entries(markets).map(([key, cfg]) => {
        const mk = {
          key, label: cfg.label, icon: cfg.icon, line: cfg.line,
          my_prediction: m.my_predictions?.[key] || null,
          result: actualResult ? actualResult[key] : null,
          was_correct: null,
        };

        const my = m.my_predictions?.[key];
        if (my && my.settled) {
          if (my.is_correct === null) mk.was_correct = 'push';
          else mk.was_correct = my.is_correct;
        } else if (my && actualResult && actualResult[key] !== null) {
          if (key === 'both_score' || key === 'red_card') {
            mk.was_correct = my.prediction === actualResult[key];
          } else if (mk.line) {
            const actual = actualResult[key];
            const line = parseFloat(my.line || mk.line);
            if (my.prediction === 'exact') {
              mk.was_correct = actual === line;
            } else if (actual === line) {
              mk.was_correct = 'push';
            } else {
              mk.was_correct = (actual > line ? 'over' : 'under') === my.prediction;
            }
          }
        }

        return mk;
      });

      return { ...m, markets: matchMarkets };
    });

    return success(res, data, { total: data.length });
  } catch (err) {
    next(err);
  }
}

async function getMyPredictions(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return error(res, 401, 'NO_AUTH', 'Authentication required');

    const predictions = await predictionRepo.getMyPredictions(userId);
    return success(res, predictions, { total: predictions.length, points: predictions.reduce((s, p) => s + (p.points || 0), 0) });
  } catch (err) {
    next(err);
  }
}

async function createPrediction(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return error(res, 401, 'NO_AUTH', 'Authentication required');

    const { fixture_id, market, line, prediction } = req.body;

    const validMarkets = predictionRepo.getMarkets();
    if (!validMarkets[market]) {
      return error(res, 400, 'INVALID_MARKET', `Market must be one of: ${Object.keys(validMarkets).join(', ')}`);
    }

    if (!['over', 'exact', 'under', 'yes', 'no', 'home', 'away', 'draw'].includes(prediction)) {
      return error(res, 400, 'INVALID_PREDICTION', 'Prediction must be over/exact/under/yes/no/home/away/draw');
    }

    const result = await predictionRepo.create(userId, fixture_id, market, line, prediction);
    return success(res, result);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 409, 'DUPLICATE', 'Ya tienes un pronóstico para este mercado en este partido');
    }
    next(err);
  }
}

async function settlePredictions(req, res, next) {
  try {
    const { fixtureId } = req.params;
    const result = await predictionRepo.settle(fixtureId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getLeaderboard(req, res, next) {
  try {
    const result = await predictionRepo.getLeaderboard();
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMarkets, getUpcomingMatches, getMyPredictions,
  createPrediction, settlePredictions, getLeaderboard,
};
