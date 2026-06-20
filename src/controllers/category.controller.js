'use strict';

const catalogService = require('../services/catalog.service');
const { success }    = require('../lib/responseHelper');

exports.index = async (req, res, next) => {
  try {
    const data = await catalogService.getCategoryIndex(req.category);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.browse = async (req, res, next) => {
  try {
    const { value, page = 1 } = req.params;
    const type = req.query.type === 'movie' || req.query.type === 'series' ? req.query.type : undefined;
    const data = await catalogService.getCategoryBrowse(req.category, value, type, page);
    success(res, data, { filters: { [req.category]: value, type: type || 'all', page } });
  } catch (err) {
    next(err);
  }
};

exports.browseSeries = async (req, res, next) => {
  try {
    const { value, page = 1 } = req.params;
    const data = await catalogService.getCategoryBrowse(req.category, value, 'series', page);
    success(res, data, { filters: { [req.category]: value, type: 'series', page } });
  } catch (err) {
    next(err);
  }
};

exports.browseMovie = async (req, res, next) => {
  try {
    const { value, page = 1 } = req.params;
    const data = await catalogService.getCategoryBrowse(req.category, value, 'movie', page);
    success(res, data, { filters: { [req.category]: value, type: 'movie', page } });
  } catch (err) {
    next(err);
  }
};
