'use strict';

const seriesService = require('../services/series.service');

exports.trending = async (req, res, next) => {
  try {
    const data = await seriesService.getTrending();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.marvelSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getMarvelSeries();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.appleTv = async (req, res, next) => {
  try {
    const data = await seriesService.getAppleTv();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.disneyPlus = async (req, res, next) => {
  try {
    const data = await seriesService.getDisneyPlus();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.hboSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getHboSeries();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.netflixSeries = async (req, res, next) => {
  try {
    const data = await seriesService.getNetflixSeries();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.netflixSeriesPage = async (req, res, next) => {
  try {
    const data = await seriesService.getNetflixSeriesPage(req.params.page);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
