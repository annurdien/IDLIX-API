'use strict';

const movieService = require('../services/movie.service');

exports.mcu = async (req, res, next) => {
  try {
    const data = await movieService.getMcu();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.trending = async (req, res, next) => {
  try {
    const data = await movieService.getTrending();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.trendingPage = async (req, res, next) => {
  try {
    const data = await movieService.getTrendingPage(req.params.page);
    res.json(data);
  } catch (err) {
    next(err); // 404 thrown by service propagates here
  }
};