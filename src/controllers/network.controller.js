'use strict';

const catalogService = require('../services/catalog.service');
const { success }    = require('../lib/responseHelper');

exports.index = async (req, res, next) => {
  try {
    const data = await catalogService.getCategoryIndex('network');
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.browse = async (req, res, next) => {
  try {
    const { network, page = 1 } = req.params;
    const type = req.query.type === 'movie' || req.query.type === 'series' ? req.query.type : undefined;
    const data = await catalogService.getCategoryBrowse('network', network, type, page);
    success(res, data, { filters: { network, type: type || 'all', page } });
  } catch (err) {
    next(err);
  }
};
