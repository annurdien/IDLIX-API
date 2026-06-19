'use strict';

const leaderboardService = require('../services/leaderboard.service');
const { success }        = require('../lib/responseHelper');

exports.index = async (req, res, next) => {
  try {
    const data = await leaderboardService.getLeaderboard();
    success(res, data, { meta: { count: data.length } });
  } catch (err) {
    next(err);
  }
};
