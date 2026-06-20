'use strict';

const { Router }        = require('express');
const generalRoutes     = require('./general.routes');
const movieRoutes       = require('./movie.routes');
const seriesRoutes      = require('./series.routes');
const searchRoutes      = require('./search.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const categoryRoutes    = require('./category.routes');
const { validateSlug, validateYear } = require('../middleware/validate');

const router = Router();

router.use('/',            generalRoutes);
router.use('/movie',       movieRoutes);
router.use('/series',      seriesRoutes);
router.use('/search',      searchRoutes);
router.use('/leaderboard', leaderboardRoutes);

// Consolidated category routes
router.use('/genre',       categoryRoutes('genre', validateSlug));
router.use('/country',     categoryRoutes('country', validateSlug));
router.use('/year',        categoryRoutes('year', validateYear));
router.use('/network',     categoryRoutes('network', validateSlug));

module.exports = router;
