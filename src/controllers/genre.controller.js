'use strict';

const genreService   = require('../services/genre.service');
const catalogService = require('../services/catalog.service');
const { success }    = require('../lib/responseHelper');

exports.index = async (req, res, next) => {
  try {
    const data = await catalogService.getCategoryIndex('genre');
    success(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * Unified genre browse — supports ?type=movie|series filter.
 * GET /api/genre/:genre
 */
exports.genreBrowse = async (req, res, next) => {
  try {
    const { genre, page = 1 } = req.params;
    const type = req.query.type === 'movie' || req.query.type === 'series' ? req.query.type : undefined;
    const data = await catalogService.getCategoryBrowse('genre', genre, type, page);
    success(res, data, { filters: { genre, type: type || 'all', page } });
  } catch (err) {
    next(err);
  }
};

exports.genreSeries = async (req, res, next) => {
  try {
    const { genre, page = 1 } = req.params;
    const data = await genreService.getGenreSeries(genre, page);
    success(res, data, { filters: { genre, type: 'series', page } });
  } catch (err) {
    next(err);
  }
};

exports.genreMovie = async (req, res, next) => {
  try {
    const { genre, page = 1 } = req.params;
    const data = await genreService.getGenreMovie(genre, page);
    success(res, data, { filters: { genre, type: 'movie', page } });
  } catch (err) {
    next(err);
  }
};