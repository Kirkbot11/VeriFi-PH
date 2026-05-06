const axios = require("axios");
const cheerio = require("cheerio");

function detectPlatform(url) {
  const u = url.toLowerCase();

  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("x.com") || u.includes("twitter.com")) return "x";
  return "unknown";
}

/**
 * Extract basic metadata only (NO FULL SCRAPING)
 */
async function extractSocialMetadata(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(res.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text();

    const description =
      $('meta[property="og:description"]').attr("content") || "";

    const image =
      $('meta[property="og:image"]').attr("content") || null;

    return {
      title,
      description,
      image,
      platform: detectPlatform(url),
      rawHtml: res.data
    };
  } catch (err) {
    return null;
  }
}

/**
 * Try to find REAL article links inside social posts
 */
function extractExternalLinks(html) {
  const $ = cheerio.load(html);

  const links = $("a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);

  return links.filter(l =>
    l.startsWith("http") &&
    !l.includes("facebook.com") &&
    !l.includes("instagram.com") &&
    !l.includes("x.com")
  );
}

/**
 * MAIN FUNCTION
 */
async function resolveSocialUrl(url) {
  const meta = await extractSocialMetadata(url);

  if (!meta) {
    return {
      type: "social",
      resolved: false,
      reason: "Cannot access social content"
    };
  }

  const links = extractExternalLinks(meta.rawHtml);

  return {
    type: "social",
    platform: meta.platform,
    title: meta.title,
    description: meta.description,
    image: meta.image,
    extractedLinks: links,
    resolvedUrl: links[0] || null
  };
}

module.exports = resolveSocialUrl;