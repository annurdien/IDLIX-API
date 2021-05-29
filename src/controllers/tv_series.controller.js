/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 15:57:55
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 17:39:11
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

"use strict";

const cheerio = require("cheerio");
const Axios = require("../../config/tools");
const cache = require("../../config/database");
const cacheTime = require("../../cacheTime.json");

/** Trending */
exports.trending = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.trending.get("trending.tv");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.trending * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/trending/?get=tv");

    const $ = cheerio.load(response.data);
    const element = $(".content.right.normal");

    /* find n each data */
    let trendingTv = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.tvshows")
      .each((_, e) => {
        title = $(e).find(".poster > img").attr("alt");
        console.log(title);
        link = {
          endpoint: $(e)
            .find(".poster > a")
            .attr("href")
            .replace("https://185.231.223.71/", ""),
          url: $(e).find(".poster > a").attr("href"),
          thumbnail: $(e).find(".poster > img").attr("data-src"),
        };

        trendingTv.push({
          title,
          link,
        });
      });

    await cache.trending.set("trending.tv", {
      data: trendingTv,
      timestamp: Date.now(),
    });

    const cacheData = cache.trending.get("trending.tv");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Marvel Cenimatic Universe Movie */
exports.marvelSeries = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.marvelSeries.get("marvelseries");
    console.log(caches);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/marvel-studios-series");
    const $ = cheerio.load(response.data);
    const element = $(".single-page");

    /* find n each data */
    let marvelSeries = [];
    let title, link;

    $(element)
      .find(".wp-content > .row > .column")
      .each((_, e) => {
        title = $(e).find(".card > a").attr("title");

        link = {
          endpoint: $(e).find(".card > a").attr("href"),
          url:
            $(e).find(".card > a").attr("href") === undefined
              ? null
              : "https://185.231.223.71/tvseries" +
                $(e).find(".card > a").attr("href"),
          thumbnail: $(e).find(".card > a > img").attr("src"),
        };

        // Check if link.url === null or not, if !null then push to database.
        let push = link.url === null ? false : true;

        // Update data on database.
        if (push) marvelSeries.push({ title, link });
      });

    await cache.marvelSeries.set("marvelseries", {
      data: marvelSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.marvelSeries.get("marvelseries");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Apple TV Series */
exports.appleTv = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.appleTvSeries.get("appletvseries");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/network/apple-tv");

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let appleTvSeries = [];
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

        appleTvSeries.push({
          title,
          link,
        });
      });

    await cache.appleTvSeries.set("appletvseries", {
      data: appleTvSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.appleTvSeries.get("appletvseries");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Disneyplus Series */
exports.disneyPlus = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.disneyPlusSeries.get("disneyplusseries");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/network/disney");

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let disneyPlusSeries = [];
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

        disneyPlusSeries.push({
          title,
          link,
        });
      });

    await cache.disneyPlusSeries.set("disneyplusseries", {
      data: disneyPlusSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.disneyPlusSeries.get("disneyplusseries");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** HBO Series */
exports.hboSeries = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.hboSeries.get("hboseries");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/network/HBO");

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let hboSeries = [];
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

        hboSeries.push({
          title,
          link,
        });
      });

    await cache.hboSeries.set("hboseries", {
      data: hboSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.hboSeries.get("hboseries");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Netflix Series */
exports.netflixSeries = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.netflixSeries.get("netflixseries");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/network/netflix");

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let netflixSeries = [];
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

        netflixSeries.push({
          title,
          link,
        });
      });

    await cache.netflixSeries.set("netflixseries", {
      data: netflixSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.netflixSeries.get("netflixseries");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Netflix Series Pages */
exports.netflixSeriesPage = async (req, res) => {
  try {

    /* Params url*/
    let page = req.params.page;

    /* Get data from cache*/
    const caches = await cache.netflixSeries.get(`netflixseries.${page}`);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.series * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios(`/network/netflix/page/${page}/`);

    const $ = cheerio.load(response.data);
    const element = $(".items.normal");

    /* find n each data */
    let netflixSeries = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.tvshows")
      .each((_, e) => {
        title = $(e).find(".poster > img").attr("alt");
        link = {
          endpoint: $(e)
            .find(".poster > a")
            .attr("href")
            .replace("https://185.231.223.71/", ""),
          url: $(e).find(".poster > a").attr("href"),
          thumbnail: $(e).find(".poster > img").attr("data-src"),
        };

        netflixSeries.push({
          title,
          link,
        });
      });

    await cache.netflixSeries.set(`netflixseries.${page}`, {
      data: netflixSeries,
      timestamp: Date.now(),
    });

    const cacheData = cache.netflixSeries.get(`netflixseries.${page}`);
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};