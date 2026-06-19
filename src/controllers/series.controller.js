'use strict';

const seriesService = require('../services/series.service');
const { success } = require('../lib/responseHelper');

exports.browse = async (req, res, next) => {
  try {
    const data = await seriesService.getBrowse();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.trending = async (req, res, next) => {
  try {
    const data = await seriesService.getTrending();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.marvelSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getMarvelSeries();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.appleTv = async (req, res, next) => {
  try {
    const data = await seriesService.getAppleTv();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.disneyPlus = async (req, res, next) => {
  try {
    const data = await seriesService.getDisneyPlus();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.hboSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getHboSeries();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.netflixSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getNetflixSeries();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.netflixSeriesPage = async (req, res, next) => {
  try {
    const data = await seriesService.getNetflixSeriesPage(req.params.page);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await seriesService.getDetail(req.params.slug);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.stream = async (req, res, next) => {
  try {
    const streamUrl = await seriesService.getStreamUrl(req.params.slug);
    if (!streamUrl) {
      return res.status(404).json({
        success: false,
        message: 'Stream URL could not be extracted. The site may require additional authentication.',
      });
    }
    success(res, { slug: req.params.slug, streamUrl });
  } catch (err) {
    next(err);
  }
};
