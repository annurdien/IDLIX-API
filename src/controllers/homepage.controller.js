'use strict';

const homepageService = require('../services/homepage.service');

exports.status = (req, res) => {
  res.json({ success: true, message: 'IDLIX Scrapper', repo: 'annurdien' });
};

exports.featured = async (req, res, next) => {
  try {
    const data = await homepageService.getFeatured();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.cinemaxxi = async (req, res, next) => {
  try {
    const data = await homepageService.getCinemaxxi();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
