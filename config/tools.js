/**
 * @ Author: Annurdien Rasyid
 * @ Create Time: 2021-05-29 02:55:05
 * @ Modified by: Annurdien Rasyid
 * @ Modified time: 2021-05-29 15:34:32
 * @ Description: IDLIX API for scrapping movie from IDLIX
 */

/* Module */
const axios = require("axios").default;
const tough = require("tough-cookie");
const baseURL = "https://185.231.223.71/";
const cookieJar = new tough.CookieJar();

/* === */
axios.defaults.baseURL = baseURL;
axios.defaults.jar = cookieJar;

/* Function */
const Axios = async (url) => {
  return new Promise(async (fullfill, reject) => {
    try {
      const res = await axios.get(url);
      if (res.status === 200) return fullfill(res);
      else reject(res);
    } catch (err) {
      return reject({ status: false, error: err.message });
    }
  });
};

module.exports = Axios;
