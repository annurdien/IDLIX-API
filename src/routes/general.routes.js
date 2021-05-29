const router = require("express").Router();
const generalController = require("../controllers/general.controller");

/* Home */
router.get('/', generalController.status);
router.get('/featured', generalController.featured);
router.get('/cinemaxxi', generalController.cinemaxxi);
router.get('/mcu', generalController.mcu);

module.exports = router;
