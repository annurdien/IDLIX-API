const router = require("express").Router();
const genreController = require("../controllers/genre.controller");

/** Genre Series */
router.get("/series/:page", genreController.genreSeries);

/** Genre Movie */
router.get("/movie/:page", genreController.genreMovie);


module.exports = router;
