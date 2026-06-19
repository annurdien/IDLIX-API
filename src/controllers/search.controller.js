'use strict';

const searchService = require('../services/search.service');
const { success }   = require('../lib/responseHelper');

exports.search = async (req, res, next) => {
  try {
    const q = req.query.q;
    const items = await searchService.search(q);
    success(res, items, {
      meta: { query: q, count: items.length },
    });
  } catch (err) {
    next(err);
  }
};
