function detectPlatform(url) {
  if (!url) return "unknown";

  const u = url.toLowerCase();

  if (u.includes("facebook.com")) return "Facebook";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("x.com") || u.includes("twitter.com")) return "X (Twitter)";
  if (u.includes("tiktok.com")) return "TikTok";

  return "Web";
}

/**
 * SOCIAL SCORE (0 - 1)
 */
function socialVerifier({ url }) {
  const platform = detectPlatform(url);

  let score = 0.5;

  switch (platform) {
    case "Facebook":
      score = 0.4;
      break;
    case "Instagram":
      score = 0.45;
      break;
    case "X (Twitter)":
      score = 0.5;
      break;
    case "TikTok":
      score = 0.35;
      break;
    default:
      score = 0.6;
  }

  // trusted overrides
  if (url?.includes(".gov.ph") || url?.includes("abs-cbn") || url?.includes("inquirer")) {
    score = 0.9;
  }

  return score;
}

module.exports = socialVerifier;