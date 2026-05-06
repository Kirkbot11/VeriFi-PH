const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Extract social post metadata (video/text)
 */
async function extractSocialPost(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(res.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text();

    const description =
      $('meta[property="og:description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      null;

    const video =
      $('meta[property="og:video"]').attr("content") ||
      $('meta[property="og:video:url"]').attr("content") ||
      null;

    const site =
      $('meta[property="og:site_name"]').attr("content") ||
      new URL(url).hostname;

    return {
      title,
      description,
      image,
      video,   // 🔥 IMPORTANT: video detection
      source: site,
      url
    };

  } catch (err) {
    return null;
  }
}

module.exports = extractSocialPost;