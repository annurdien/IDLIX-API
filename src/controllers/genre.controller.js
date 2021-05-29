/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 18:31:58
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 19:31:28
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

"use strict";

const cheerio = require("cheerio");
const Axios = require("../../config/tools");
const cache = require("../../config/database");
const cacheTime = require("../../cacheTime.json");

/** Netflix Series */
exports.genreSeries = async (req, res) => {
  /* Params url*/
  let genre = req.params.genre;
  let page = req.params.page === null ? 1 : req.params.page;
  
  try {
    /* Get data from cache*/
    const caches = await cache.page.get(`page.series.${genre}.${page}`);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.page * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios(`/genre/${genre}/page/${page}`);

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let genreSeries = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.tvshows")
      .each((_, e) => {
        title = $(e).find(".poster > img").attr("alt");
        console.log(title);
        console.log(title);
        link = {
          endpoint: $(e)
            .find(".poster > a")
            .attr("href")
            .replace("https://185.231.223.71/", ""),
          url: $(e).find(".poster > a").attr("href"),
          thumbnail: $(e).find(".poster > img").attr("data-src"),
        };

        genreSeries.push({
          title,
          link,
        });
      });

    await cache.page.set(`page.series.${genre}.${page}`, {
      data: genreSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.page.get(`page.series.${genre}.${page}`);
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Genre Movie */
exports.genreMovie = async (req, res) => {
  /* Params url*/
  let genre = req.params.genre;
  let page = req.params.page === null  ? 1 : req.params.page;

  try {
    /* Get data from cache*/
    const caches = await cache.page.get(`page.movie.${genre}.${page}`);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.page * 3600000
        ? true
        : false;

   // if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios(`/genre/${genre}/page/${page}`);

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let genreMovie = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.movies")
      .each((_, e) => {
        title = $(e).find(".poster > img").attr("alt");
        console.log(title);
        console.log(title);
        link = {
          endpoint: $(e)
            .find(".poster > a")
            .attr("href")
            .replace("https://185.231.223.71/", ""),
          url: $(e).find(".poster > a").attr("href"),
          thumbnail: $(e).find(".poster > img").attr("data-src"),
        };

        genreMovie.push({
          title,
          link,
        });
      });

    await cache.page.set(`page.movie.${genre}.${page}`, {
      data: genreMovie,
      timestamp: Date.now(),
    });

    const cacheData = cache.page.get(`page.movie.${genre}.${page}`);
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};