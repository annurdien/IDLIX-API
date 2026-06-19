'use strict';

const { Router }        = require('express');
const generalRoutes     = require('./general.routes');
const movieRoutes       = require('./movie.routes');
const seriesRoutes      = require('./series.routes');
const genreRoutes       = require('./genre.routes');
const countryRoutes     = require('./country.routes');
const yearRoutes        = require('./year.routes');
const networkRoutes     = require('./network.routes');
const searchRoutes      = require('./search.routes');
const leaderboardRoutes = require('./leaderboard.routes');

const router = Router();

router.use('/',            generalRoutes);
router.use('/movie',       movieRoutes);
router.use('/series',      seriesRoutes);
router.use('/genre',       genreRoutes);
router.use('/country',     countryRoutes);
router.use('/year',        yearRoutes);
router.use('/network',     networkRoutes);
router.use('/search',      searchRoutes);
router.use('/leaderboard', leaderboardRoutes);

module.exports = router;
