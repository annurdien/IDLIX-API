'use strict';

const { Router }      = require('express');
const movieController  = require('../controllers/movie.controller');
const { validatePage, validateMediaSlug } = require('../middleware/validate');

const router = Router();

/** GET /api/movie */
router.get('/', movieController.browse);

/** GET /api/movie/mcu */
router.get('/mcu', movieController.mcu);

/** GET /api/movie/trending */
router.get('/trending', movieController.trending);

/** GET /api/movie/trending/:page */
router.get('/trending/:page', validatePage, movieController.trendingPage);

/** GET /api/movie/:slug — detail page with rich metadata */
router.get('/:slug', validateMediaSlug, movieController.detail);

/** GET /api/movie/:slug/stream — extract stream URL via Puppeteer */
router.get('/:slug/stream', validateMediaSlug, movieController.stream);

module.exports = router;
