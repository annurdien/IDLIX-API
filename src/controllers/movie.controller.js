'use strict';

const movieService = require('../services/movie.service');
const { success } = require('../lib/responseHelper');

exports.browse = async (req, res, next) => {
  try {
    const data = await movieService.getBrowse();
    success(res, data);
  } catch (err) {
    next(err);
  }
};


exports.trending = async (req, res, next) => {
  try {
    const data = await movieService.getTrending();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.trendingPage = async (req, res, next) => {
  try {
    const data = await movieService.getTrendingPage(req.params.page);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await movieService.getDetail(req.params.slug);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.stream = async (req, res, next) => {
  try {
    const result = await movieService.getStreamData(req.params.slug);
    if (!result.streamUrl) {
      return res.status(404).json({
        success: false,
        message: 'Stream URL could not be extracted. The site may require additional authentication.',
      });
    }
    success(res, { slug: req.params.slug, ...result });
  } catch (err) {
    next(err);
  }
};