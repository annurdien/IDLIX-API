const router = require("express").Router();
const generalController = require("../controllers/homepage.controller");
const movieNavController = require('../controllers/movie_nav.controller');

/* Home */
router.get('/', generalController.status);

/** Featured Movie */
router.get('/featured', generalController.featured);

/** Cinema XXI Movie */
router.get('/cinemaxxi', generalController.cinemaxxi);

/** Marvel Cenimatic Universe Movie*/
router.get('/mcu', movieNavController.mcu);

/** Trending Movie */
router.get('/trending', movieNavController.trending);

/** Trending Page */
router.get('/trending/:page', movieNavController.trendingPage);

module.exports = router;
