'use strict';

const { Router } = require('express');
const networkController = require('../controllers/network.controller');
const { validatePage, validateSlug } = require('../middleware/validate');

const router = Router();

/** GET /api/network */
router.get('/', networkController.index);

/** GET /api/network/:network */
router.get('/:network', validateSlug, networkController.browse);

/** GET /api/network/:network/:page */
router.get('/:network/:page', validateSlug, validatePage, networkController.browse);

module.exports = router;
