'use strict';

const { Router }          = require('express');
const genreController     = require('../controllers/genre.controller');
const { validatePage, validateGenre } = require('../middleware/validate');

const router = Router();

/** GET /api/genre/series/:genre */
router.get('/series/:genre', validateGenre, genreController.genreSeries);

/** GET /api/genre/series/:genre/:page */
router.get('/series/:genre/:page', validateGenre, validatePage, genreController.genreSeries);

/** GET /api/genre/movie/:genre */
router.get('/movie/:genre', validateGenre, genreController.genreMovie);

/** GET /api/genre/movie/:genre/:page */
router.get('/movie/:genre/:page', validateGenre, validatePage, genreController.genreMovie);

module.exports = router;
