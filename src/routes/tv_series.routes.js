/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 15:57:43
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 17:39:11
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

const router = require("express").Router();
const seriesController = require("../controllers/tv_series.controller");

/** Trending Tv Series */
router.get("/trending", seriesController.trending);

/** Marvel Series */
router.get("/marvel", seriesController.marvelSeries);

/** Apple TV Series */
router.get("/apple", seriesController.appleTv);

/** Disney Plus Series */
router.get("/disney",seriesController.disneyPlus);

/** HBO Series */
router.get("/hbo", seriesController.hboSeries);

/** Netflix Series*/
router.get("/netflix", seriesController.netflixSeries);

/** Netflix Series Pages */
router.get("/netflix/:page", seriesController.netflixSeriesPage);

module.exports = router;
