'use strict';

const { Router }        = require('express');
const generalController  = require('../controllers/homepage.controller');

const router = Router();

/** GET /api/ — health / status */
router.get('/', generalController.status);

/** GET /api/featured — Featured / Trending Now movies */
router.get('/featured', generalController.featured);

/** GET /api/cinemaxxi — Recently Added Movies */
router.get('/cinemaxxi', generalController.cinemaxxi);

/** GET /api/home — All homepage content as flat array */
router.get('/home', generalController.home);

/** GET /api/home/sections — Homepage content grouped by section title */
router.get('/home/sections', generalController.homeSections);

module.exports = router;
