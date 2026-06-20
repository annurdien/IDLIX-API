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
    const result = await seriesService.getStreamData(req.params.slug);
    if (!result.streamUrl) {
      return res.status(404).json({
        success: false,
        message: 'Stream URL could not be extracted. The site may require additional authentication.',
      });
    }
    success(res, {
      slug:        req.params.slug,
      streamUrl:   result.streamUrl,
      subtitles:   result.subtitles   || [],
      videoId:     result.videoId     || null,
      title:       result.title       || null,
      durationSec: result.durationSec || null,
      maxHeight:   result.maxHeight   || null,
      expiresAt:   result.expiresAt   || null,
    });
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
      season:      Number(season),
      episode:     Number(episode),
      streamUrl:   result.streamUrl,
      subtitles:   result.subtitles   || [],
      videoId:     result.videoId     || null,
      title:       result.title       || null,
      durationSec: result.durationSec || null,
      maxHeight:   result.maxHeight   || null,
      expiresAt:   result.expiresAt   || null,
    });
  } catch (err) {
    next(err);
  }
};
