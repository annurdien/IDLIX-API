'use strict';

const { Router }      = require('express');
const seriesController = require('../controllers/series.controller');
const { validatePage } = require('../middleware/validate');

const router = Router();

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

module.exports = router;
