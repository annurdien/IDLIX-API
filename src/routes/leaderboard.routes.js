'use strict';

const { Router }             = require('express');
const leaderboardController   = require('../controllers/leaderboard.controller');

const router = Router();

/** GET /api/leaderboard */
router.get('/', leaderboardController.index);

module.exports = router;
