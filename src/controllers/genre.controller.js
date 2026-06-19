'use strict';

const genreService = require('../services/genre.service');

exports.genreSeries = async (req, res, next) => {
  try {
    const { genre, page = 1 } = req.params;
    const data = await genreService.getGenreSeries(genre, page);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.genreMovie = async (req, res, next) => {
  try {
    const { genre, page = 1 } = req.params;
    const data = await genreService.getGenreMovie(genre, page);
    res.json(data);
  } catch (err) {
    next(err);
  }
};