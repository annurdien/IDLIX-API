'use strict';

const homepageService = require('../services/homepage.service');
const { success } = require('../lib/responseHelper');

exports.status = (req, res) => {
  res.json({ success: true, message: 'IDLIX Scrapper API v3', repo: 'annurdien' });
};

exports.featured = async (req, res, next) => {
  try {
    const data = await homepageService.getFeatured();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.cinemaxxi = async (req, res, next) => {
  try {
    const data = await homepageService.getCinemaxxi();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.home = async (req, res, next) => {
  try {
    const data = await homepageService.getHome();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.homeSections = async (req, res, next) => {
  try {
    const data = await homepageService.getHomeSections();
    success(res, data);
  } catch (err) {
    next(err);
  }
};
