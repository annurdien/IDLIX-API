'use strict';

const { Router } = require('express');
const countryController = require('../controllers/country.controller');
const { validatePage, validateSlug } = require('../middleware/validate');

const router = Router();

/** GET /api/country */
router.get('/', countryController.index);

/** GET /api/country/:country */
router.get('/:country', validateSlug, countryController.browse);

/** GET /api/country/:country/:page */
router.get('/:country/:page', validateSlug, validatePage, countryController.browse);

module.exports = router;
