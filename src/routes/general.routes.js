/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 03:39:41
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 17:39:14
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

const router = require("express").Router();
const generalController = require("../controllers/homepage.controller");

/* Home */
router.get("/", generalController.status);

/** Featured Movie */
router.get("/featured", generalController.featured);

/** Cinema XXI Movie */
router.get("/cinemaxxi", generalController.cinemaxxi);

module.exports = router;
