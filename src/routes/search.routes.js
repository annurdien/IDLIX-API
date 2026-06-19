'use strict';

const { Router }       = require('express');
const searchController  = require('../controllers/search.controller');
const { validateSearchQuery } = require('../middleware/validate');

const router = Router();

/** GET /api/search?q=batman */
router.get('/', validateSearchQuery, searchController.search);

module.exports = router;
