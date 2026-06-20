'use strict';

const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const { validatePage } = require('../middleware/validate');

/**
 * Creates a generic category router for genre, country, year, and network.
 * @param {string} category - The name of the category ('genre', 'country', etc.)
 * @param {Function} validator - The middleware function to validate the parameter
 * @returns {Router}
 */
module.exports = (category, validator) => {
  const router = Router();
  
  // Inject the category type into req for the controller to use
  const setCategory = (req, res, next) => { req.category = category; next(); };

  router.use(setCategory);

  router.get('/', categoryController.index);
  
  router.get('/series/:value', validator, categoryController.browseSeries);
  router.get('/series/:value/:page', validator, validatePage, categoryController.browseSeries);
  
  router.get('/movie/:value', validator, categoryController.browseMovie);
  router.get('/movie/:value/:page', validator, validatePage, categoryController.browseMovie);
  
  router.get('/:value', validator, categoryController.browse);
  router.get('/:value/:page', validator, validatePage, categoryController.browse);

  return router;
};
