'use strict';

const { Router }    = require('express');
const generalRoutes = require('./general.routes');
const movieRoutes   = require('./movie.routes');
const seriesRoutes  = require('./series.routes');
const genreRoutes   = require('./genre.routes');

const router = Router();

router.use('/',       generalRoutes);
router.use('/movie',  movieRoutes);
router.use('/series', seriesRoutes);
router.use('/genre',  genreRoutes);

module.exports = router;
