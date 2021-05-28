"use strict";

const cheerio = require("cheerio");
const Axios = require("../../config/tools");
const cache = require("../../config/database");
const cacheTime = require("../../cacheTime.json");

exports.status = async (_, res) => {
  try {
    let data = await Axios("/");
    res.send({
      success: true,
      statusCode: data.status,
      statusMessage: data.statusText,
    });
  } catch (e) {
    res.send({ success: false, message: e.message });
  }
};

exports.featured = async (_, res) => {
  try {
    /* Get data from cache*/
    const caches = await cache.featured.get("featured");
    const hit =
      Date.now() - (caches?.timestamp || 0) < cacheTime.rekomendasi * 3600000
        ? true
        : false;
    if (hit) return res.send(caches.data)

    /* Get Data */
    const response = await Axios("/");
    const $ = cheerio.load(response.data);
    const element = $(".items.featured");

    /* find n each data */
    let featured = [];
    let title, link;

    $(element)
      .find(".item.movies")
      .each((_, e) => {
        title = $(e).find(".poster > img").attr("alt");

        link = {
          endpoint: $(e)
            .find(".data.dfeatur > h3 > a")
            .attr("href")
            .replace("https://185.231.223.71/movie/", ""),
          url: $(e).find(".data.dfeatur > h3 > a").attr("href"),
          thumbnail: $(e).find(".poster > img").attr("data-src"),
        };

        console.log(link);

        featured.push({
          title,
          link,
        });
      });

    await cache.featured.set("featured", {

      data: featured,
      timestamp: Date.now(),

    });

    const cacheData = cache.featured.get("featured");
    res.send(cacheData.data);

  } catch (err) {

    res.send({ success: false, error: err.error });

  }
};
