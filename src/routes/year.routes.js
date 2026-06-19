'use strict';

const { Router } = require('express');
const yearController = require('../controllers/year.controller');
const { validatePage, validateYear } = require('../middleware/validate');

const router = Router();

/** GET /api/year */
router.get('/', yearController.index);

/** GET /api/year/:year */
router.get('/:year', validateYear, yearController.browse);

/** GET /api/year/:year/:page */
router.get('/:year/:page', validateYear, validatePage, yearController.browse);

module.exports = router;
