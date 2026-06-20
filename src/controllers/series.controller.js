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
    const result = await seriesService.getStreamData(req.params.slug);
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

exports.episodeStream = async (req, res, next) => {
  try {
    const { slug, season, episode } = req.params;
    const result = await seriesService.getEpisodeStreamData(slug, season, episode);
    if (!result.streamUrl) {
      return res.status(404).json({
        success: false,
        message: 'Stream URL could not be extracted. The site may require additional authentication.',
      });
    }
    success(res, {
      slug,
      season: Number(season),
      episode: Number(episode),
      ...result
    });
  } catch (err) {
    next(err);
  }
};
