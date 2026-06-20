'use strict';

const { Router }       = require('express');
const seriesController  = require('../controllers/series.controller');
const { validatePage, validateMediaSlug, validateEpisodeParams } = require('../middleware/validate');

const router = Router();

/** GET /api/series */
router.get('/', seriesController.browse);

/** GET /api/series/trending */
router.get('/trending', seriesController.trending);

/** GET /api/series/marvel */
router.get('/marvel', seriesController.marvelSeries);

/** GET /api/series/apple */
router.get('/apple', seriesController.appleTv);

/** GET /api/series/disney */
router.get('/disney', seriesController.disneyPlus);

/** GET /api/series/hbo */
router.get('/hbo', seriesController.hboSeries);

/** GET /api/series/netflix */
router.get('/netflix', seriesController.netflixSeries);

/** GET /api/series/netflix/:page */
router.get('/netflix/:page', validatePage, seriesController.netflixSeriesPage);

/** GET /api/series/:slug/season/:season/episode/:episode/stream */
router.get(
  '/:slug/season/:season/episode/:episode/stream',
  validateMediaSlug,
  validateEpisodeParams,
  seriesController.episodeStream
);

/** GET /api/series/:slug — detail page with rich metadata */
router.get('/:slug', validateMediaSlug, seriesController.detail);

/** GET /api/series/:slug/stream — stream URL for first episode (backward-compat) */
router.get('/:slug/stream', validateMediaSlug, seriesController.stream);

module.exports = router;
