'use strict';

const { Router }      = require('express');
const generalController = require('../controllers/homepage.controller');

const router = Router();

/** GET /api/ — health / status */
router.get('/', generalController.status);

/** GET /api/featured — Featured movies */
router.get('/featured', generalController.featured);

/** GET /api/cinemaxxi — Cinema XXI movies */
router.get('/cinemaxxi', generalController.cinemaxxi);

module.exports = router;
