'use strict';

const { Router }     = require('express');
const movieController = require('../controllers/movie.controller');
const { validatePage } = require('../middleware/validate');

const router = Router();

/** GET /api/movie/mcu */
router.get('/mcu', movieController.mcu);

/** GET /api/movie/trending */
router.get('/trending', movieController.trending);

/** GET /api/movie/trending/:page */
router.get('/trending/:page', validatePage, movieController.trendingPage);

module.exports = router;
