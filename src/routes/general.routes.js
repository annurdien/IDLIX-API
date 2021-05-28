const router = require("express").Router();
const generalController = require("../controllers/general.controller");

/* Home */
router.get('/', generalController.status);
router.get('/featured', generalController.featured);
router.get('/cinemaxxi', generalController.cinemaxxi);

module.exports = router;
