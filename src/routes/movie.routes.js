/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 15:53:25
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 17:39:13
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

const router = require("express").Router();
const movieNavController = require("../controllers/movie.controller");

/** Marvel Cenimatic Universe Movie*/
router.get("/mcu", movieNavController.mcu);

/** Trending Movie */
router.get("/trending", movieNavController.trending);

/** Trending Page */
router.get("/trending/:page", movieNavController.trendingPage);

module.exports = router;
