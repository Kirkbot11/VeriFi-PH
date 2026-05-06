const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

/* =========================
   SOURCE DETECTION
========================= */
function detectSource(url) {
  if (!url) return "Unknown Source";

  const u = url.toLowerCase();

  // SOCIAL MEDIA
  if (u.includes("facebook.com")) return "Facebook Post";
  if (u.includes("instagram.com")) return "Instagram Post";
  if (u.includes("tiktok.com")) return "TikTok Post";
  if (u.includes("x.com") || u.includes("twitter.com")) return "X (Twitter) Post";

  // PH NEWS
  if (u.includes("abs-cbn")) return "ABS-CBN News";
  if (u.includes("gmanetwork")) return "GMA News";
  if (u.includes("inquirer")) return "Inquirer";
  if (u.includes("rappler")) return "Rappler";
  if (u.includes("philstar")) return "PhilStar";

  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Unknown Source";
  }
}

/* =========================
   WEB SCRAPER
========================= */
async function extractWeb(url) {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(res.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text();

    const text =
      $('meta[property="og:description"]').attr("content") ||
      $("p").map((_, el) => $(el).text()).get().join(" ");

    const image =
      $('meta[property="og:image"]').attr("content") || null;

    const video =
      $('meta[property="og:video"]').attr("content") || null;

    return {
      title,
      text,
      image,
      video,
      source: detectSource(url)
    };
  } catch {
    return null;
  }
}

/* =========================
   SOCIAL MEDIA EXTRACTOR
========================= */
async function extractSocial(url) {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(res.data);

    return {
      title:
        $('meta[property="og:title"]').attr("content") || "Social Post",
      text:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "",
      image:
        $('meta[property="og:image"]').attr("content") || null,
      video:
        $('meta[property="og:video"]').attr("content") || null,
      source: detectSource(url)
    };
  } catch {
    return null;
  }
}

/* =========================
   CLAIM MATCHING
========================= */
function analyzeClaimVsContent(claim, content) {
  if (!claim || !content) return 0;

  const words = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (!words.length) return 0;

  let match = 0;

  for (const w of words) {
    if (content.toLowerCase().includes(w)) match++;
  }

  return match / words.length;
}

/* =========================
   SOURCE TRUST SCORE
========================= */
function getSourceScore(url) {
  const u = url.toLowerCase();

  // PH TRUSTED NEWS
  if (u.includes("verafiles")) return 0.98;
  if (u.includes("abs-cbn")) return 0.97;
  if (u.includes("gmanetwork")) return 0.96;
  if (u.includes("inquirer")) return 0.95;
  if (u.includes("rappler")) return 0.90;
  if (u.includes("philstar")) return 0.93;

  // SOCIAL MEDIA (LOW TRUST)
  if (
    u.includes("facebook") ||
    u.includes("instagram") ||
    u.includes("x.com") ||
    u.includes("twitter") ||
    u.includes("tiktok")
  ) return 0.40;

  return 0.35;
}

/* =========================
   MAIN ENGINE
========================= */
async function analyzeInput(input, claim = "") {
  let data = null;

  if (typeof input === "string" && input.startsWith("http")) {
    if (
      input.includes("facebook") ||
      input.includes("instagram") ||
      input.includes("x.com") ||
      input.includes("twitter") ||
      input.includes("tiktok")
    ) {
      data = await extractSocial(input);
    } else {
      data = await extractWeb(input);
    }
  }

  if (!data) {
    return {
      score: 10,
      label: "Low credibility",
      source: "Unknown Source",
      reason: "No extractable content"
    };
  }

  const sourceScore = getSourceScore(input);
  const contentScore = analyzeClaimVsContent(claim, data.text || "");

  const hasContent = (data.text || "").trim().length > 50;
  const hasMedia = !!(data.image || data.video);

  // 🔥 FIXED SCORING SYSTEM (NORMALIZED)
  let score =
    sourceScore * 50 +
    contentScore * 40 +
    (hasContent ? 10 : -15);

  // media bonus (small boost only)
  if (hasMedia) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label =
    score >= 70
      ? "High credibility"
      : score >= 40
      ? "Moderate credibility"
      : "Low credibility";

  return {
    score,
    label,
    source: data.source,
    extracted: {
      title: data.title,
      preview: (data.text || "").slice(0, 250),
      image: data.image || null,
      video: data.video || null,
      hasContent,
      hasMedia
    }
  };
}

module.exports = analyzeInput;