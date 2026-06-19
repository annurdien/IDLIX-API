'use strict';

const catalogService = require('../services/catalog.service');
const { success }    = require('../lib/responseHelper');

exports.index = async (req, res, next) => {
  try {
    const data = await catalogService.getCategoryIndex('country');
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.browse = async (req, res, next) => {
  try {
    const { country, page = 1 } = req.params;
    const type = req.query.type === 'movie' || req.query.type === 'series' ? req.query.type : undefined;
    const data = await catalogService.getCategoryBrowse('country', country, type, page);
    success(res, data, { filters: { country, type: type || 'all', page } });
  } catch (err) {
    next(err);
  }
};
