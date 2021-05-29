/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 14:15:01
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 17:39:12
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

"use strict";

const cheerio = require("cheerio");
const Axios = require("../../config/tools");
const cache = require("../../config/database");
const cacheTime = require("../../cacheTime.json");

/** Marvel Cenimatic Universe Movie */
exports.mcu = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.mcu.get("mcu");
    console.log(caches);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.mcu * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/marvel-cinematic-universe");
    const $ = cheerio.load(response.data);
    const element = $(".single-page");

    /* find n each data */
    let mcu = [];
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
              : "https://185.231.223.71/movie/" +
                $(e).find(".card > a").attr("href"),
          thumbnail: $(e).find(".card > a > img").attr("src"),
        };

        // Check if link.url === null or not, if !null then push to database.
        let push = link.url === null ? false : true;

        // Update data on database.
        if (push) mcu.push({ title, link });
      });

    await cache.mcu.set("mcu", {
      data: mcu,
      timestamp: Date.now(),
    });

    const cacheData = cache.mcu.get("mcu");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Trending Movie */
exports.trending = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.trending.get("trending");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.trending * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios("/trending/?get=movies");

    const $ = cheerio.load(response.data);
    const element = $(".content.right.normal");

    /* find n each data */
    let trending = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.movies")
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

        trending.push({
          title,
          link,
        });
      });

    await cache.trending.set("trending", {
      data: trending,
      timestamp: Date.now(),
    });

    const cacheData = cache.trending.get("trending");
    res.send(cacheData.data);
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};

/** Trending Movie */
exports.trendingPage = async (req, res) => {
  try {
    /* Params url*/
    let page = req.params.page;

    /* Get data from cache*/
    const caches = await cache.trending.get(`trending.${page}`);
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.trending * 3600000
        ? true
        : false;

    if (hit) return res.send(caches.data);

    /* Get Data */
    const response = await Axios(`/trending/page/${page}/?get=movies`);

    const $ = cheerio.load(response.data);
    const element = $(".content.right.normal");

    /* find n each data */
    let trending = [];
    let title, link;

    $(element)
      .find(".items.normal > .item.movies")
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

        trending.push({
          title,
          link,
        });
      });

    await cache.trending.set(`trending.${page}`, {
      data: trending,
      timestamp: Date.now(),
    });

    const cacheData = cache.trending.get(`trending.${page}`);

    // Handles page that dosen't exist
    let chaceDataLength = cacheData.data.length;
    let send = chaceDataLength === 0 ? false : true;

    // If movie exist in array then send respond, if not the do send {success : false, message : 'Page not found'}
    send
      ? res.send(cacheData.data)
      : res.send({ success: false, message: "Page not found" });
  } catch (err) {
    res.send({ success: false, error: err.message });
  }
};