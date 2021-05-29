/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 18:32:04
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 19:31:35
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

const router = require("express").Router();
const genreController = require("../controllers/genre.controller");

/** Genre Series */
router.get("/series/:genre/:page", genreController.genreSeries);

/** Genre Movie */
router.get("/movie/:genre/:page", genreController.genreMovie);

/** Genre without pages */
router.get("/series/:genre/", genreController.genreSeries);
router.get("/movie/:genre/", genreController.genreMovie);

module.exports = router;
