const { URL } = require("url");
const trustedSources = require("../data/trustedSources"); // ✅ REQUIRED
const safeArray = (arr) => Array.isArray(arr) ? arr : [];

/**
 * -------------------------
 * CLAIM VS CONTENT MATCH
 * -------------------------
 */
function analyzeClaimVsContent(claim, content) {
  if (!claim || !content) return 0;

  claim = String(claim).toLowerCase();
  content = String(content).toLowerCase();

  const claimWords = claim.split(/\s+/).filter(w => w.length > 3);
  if (claimWords.length === 0) return 0;

  let matches = 0;

  for (const word of claimWords) {
    if (content.includes(word)) matches++;
  }

  return matches / claimWords.length;
}

/**
 * -------------------------
 * FACT CHECK VERDICT
 * -------------------------
 */
function mapFactCheckVerdict(verdict) {
  // 🔴 NO DATA
  if (!verdict || verdict === "unknown" || verdict === "") {
    return {
      verdict: "No external fact-check available — using source analysis",
      score: 0.25,
      label: "unverified"
    };
  }

  // 🔴 API ERROR CASES
  if (
    verdict === "error" ||
    verdict === "failed" ||
    verdict === "service_unavailable"
  ) {
    return {
      verdict: "Fact-check service unavailable — fallback analysis used",
      score: 0.5,
      label: "fallback"
    };
  }

  const v = String(verdict).toLowerCase();

  if (v.includes("false") || v.includes("fake") || v.includes("debunk")) {
    return {
      verdict: "False / Debunked",
      score: 0.1,
      label: "false"
    };
  }

  if (
    v.includes("misleading") ||
    v.includes("partially") ||
    v.includes("mixed")
  ) {
    return {
      verdict: "Misleading / Partially True",
      score: 0.35,
      label: "mixed"
    };
  }

  if (v.includes("true") || v.includes("correct") || v.includes("verified")) {
    return {
      verdict: "True / Verified",
      score: 0.85,
      label: "true"
    };
  }

  return {
    verdict: "Unclear fact-check result — inferred from sources",
    score: 0.55,
    label: "uncertain"
  };
}
/**
 * -------------------------
 * SENTIMENT
 * -------------------------
 */
function mapSentimentScore(score) {
  if (typeof score !== "number") return 0.5;
  return Math.max(0, Math.min(1, score));
}

/**
 * -------------------------
 * SOCIAL MEDIA DETECTION
 * -------------------------
 */
function detectSocialScore(url) {
  if (!url) return 0.6;

  const u = url.toLowerCase();

  for (const source of trustedSources) {
    if (source.social?.some(s => u.includes(s))) {
      return 0.85;
    }
  }

  if (u.includes("facebook.com")) return 0.45;
  if (u.includes("instagram.com")) return 0.45;
  if (u.includes("x.com") || u.includes("twitter.com")) return 0.5;

  return null;
}

/**
 * -------------------------
 * SOURCE REPUTATION
 * -------------------------
 */
function calculateSourceReputation(urlValue) {
  try {
    const hostname = new URL(urlValue).hostname.toLowerCase();
    const fullUrl = urlValue.toLowerCase();

   for (const source of trustedSources) {
  const domains = Array.isArray(source.domains) ? source.domains : [];
  const socials = Array.isArray(source.social) ? source.social : [];

  if (domains.some(d => hostname.includes(d))) {
    return 0.98;
  }

  if (socials.some(s => fullUrl.includes(s))) {
    return 0.9;
  }
}

    if (hostname.endsWith(".gov.ph")) return 0.97;
    if (hostname.includes("facebook.com")) return 0.55;
    if (hostname.includes("x.com") || hostname.includes("twitter.com")) return 0.55;

    return 0.35;
  } catch {
    return 0.3;
  }
}

/**
 * -------------------------
 * LABELS
 * -------------------------
 */
function getVerdict(score) {
  if (score < 25) return "Misleading";
  if (score < 55) return "Questionable";
  return "Likely credible";
}

function getLabel(score) {
  if (score < 40) return "Low credibility";
  if (score < 70) return "Moderate credibility";
  return "High credibility";
}

/**
 * -------------------------
 * NEWS IDENTITY MATCH
 * -------------------------
 */
function getNewsIdentity(url) {
  if (!url) return null;

  const u = url.toLowerCase();

  const identities = [
    { name: "abs-cbn", match: ["abs-cbn", "abscbn", "facebook.com/abscbnnews", "abs-cbn.com"] },
    { name: "gma", match: ["gmanews", "gma.com", "facebook.com/gmanews"] },
    { name: "inquirer", match: ["inquirer", "inquirer.net", "facebook.com/inquirerdotnet"] },
    { name: "rappler", match: ["rappler", "facebook.com/rapplerdotcom"] },
    { name: "philstar", match: ["philstar", "facebook.com/philippinestar"] }
  ];

  for (const id of identities) {
    if (id.match.some(m => u.includes(m))) {
      return id.name;
    }
  }

  return null;
}

/**
 * -------------------------
 * BOOST CHECK
 * -------------------------
 */
function isTrustedSourceBoost(url) {
  if (!url) return false;

  const u = url.toLowerCase();

return trustedSources.some(source => {
  const domains = Array.isArray(source.domains) ? source.domains : [];
  const socials = Array.isArray(source.social) ? source.social : [];

  return (
    domains.some(d => u.includes(d)) ||
    socials.some(s => u.includes(s))
  );
});
}

function isVerifiedAccountBoost(url) {
  if (!url) return false;

  const u = url.toLowerCase();

  const isSocial =
    u.includes("facebook.com") ||
    u.includes("instagram.com") ||
    u.includes("x.com") ||
    u.includes("twitter.com");

  if (!isSocial) return false;

  return trustedSources.some(source =>
    source.social?.some(s => u.includes(s))
  );
}

/**
 * -------------------------
 * MAIN ENGINE
 * -------------------------
 */
function computeScore({

  
  aiProbability,
  sentimentScore,
  sourceUrl,
  claim,
  articleContent,
  factCheckVerdict
}) {
  if (!Array.isArray(articleContent)) {
    articleContent = [articleContent];
  }
function isInvalidUrl(url) {
  if (!url || typeof url !== "string") return true;

  const u = url.trim().toLowerCase();

  return (
    u === "" ||
    u.length < 5 ||
    u.includes("fake") ||
    u.includes("test") ||
    u.includes("localhost") ||
    u.includes("unknown") ||
    u.includes("127.0.0.1") ||
    u.includes("0.0.0.0")
  );
}
if (isInvalidUrl(sourceUrl)) {
  return {
    score: 0,
    verdict: "Invalid / Fake Source",
    label: "No credibility",
    breakdown: {
      source: 0,
      content: 0,
      fact_check: {
        score: 0,
        verdict: "No valid source detected",
        label: "invalid"
      },
      sentiment: 0,
      ai: 1,
      social: null,
      identity: null
    }
  };
}
  const safeContent = articleContent.filter(Boolean);

  const sourceComponent = calculateSourceReputation(sourceUrl);
  const socialComponent = detectSocialScore(sourceUrl);
  const identity = getNewsIdentity(sourceUrl);

  const socialUrl = (sourceUrl || "").toLowerCase();

  /**
   * FIX: define isTrustedSocial (YOU WERE USING IT BUT NOT DECLARED)
   */
  const isTrustedSocial = (u) => {
    if (!u) return false;
    const lower = u.toLowerCase();
    return trustedSources.some(source =>
      Array.isArray(source.social) &&
      source.social.some(s => lower.includes(s))
    );
  };

  const isVerifiedNewsSocial = isTrustedSocial(sourceUrl);

  /**
   * CONTENT
   */
  const hasNoContent =
    safeContent.length === 0 ||
    String(safeContent[0] || "").trim().length < 50;

  const contentSignal = safeContent.reduce((acc, text) => {
    return Math.max(acc, analyzeClaimVsContent(claim, text || ""));
  }, 0);

  let contentComponent = hasNoContent
    ? 0.25
    : 0.30 + contentSignal * 0.60;

  if (isVerifiedNewsSocial) {
    contentComponent = Math.min(1, contentComponent + 0.15);
  }
if (!safeContent.length || !safeContent[0] || safeContent[0].trim().length < 20) {
  return {
    score: 0,
    verdict: "No valid content extracted",
    label: "no content",
    breakdown: {
      source: 0,
      content: 0,
      fact_check: { score: 0, verdict: "No content", label: "invalid" },
      sentiment: 0,
      ai: 1,
      social: null,
      identity: null
    }
  };
}
  /**
   * CORE SIGNALS
   */
  const sentimentComponent = mapSentimentScore(sentimentScore);
  const aiComponent = 1 - aiProbability / 100;

  const factCheckResult = mapFactCheckVerdict(factCheckVerdict);
  const factCheckComponent = factCheckResult.score;

  /**
   * PENALTIES
   */
  let reliabilityPenalty = 0;

  const isSocial =
    socialUrl.includes("facebook.com") ||
    socialUrl.includes("instagram.com") ||
    socialUrl.includes("x.com") ||
    socialUrl.includes("twitter.com") ||
    socialUrl.includes("tiktok.com") ||
    socialUrl.includes("youtube.com");

  if (!sourceUrl || isSocial) {
    reliabilityPenalty += 0.1;
  }

  if (contentComponent < 0.4 && sentimentComponent < 0.4) {
    reliabilityPenalty += 0.08;
  }

  if (!factCheckVerdict || factCheckVerdict === "unknown") {
    reliabilityPenalty += 0.08;
  }

  /**
   * FINAL SCORE (MUST BE DECLARED BEFORE USE)
   */
  let total =
    sourceComponent * 0.45 +
    contentComponent * 0.25 +
    factCheckComponent * 0.20 +
    sentimentComponent * 0.08 +
    aiComponent * 0.02;

  if (socialComponent !== null) {
    total = total * 0.98 + socialComponent * 0.02;
  }

  /**
   * PENALTY APPLY
   */
  total -= reliabilityPenalty;

  /**
   * BOOSTS (FIXED ORDER)
   */
if (isTrustedSourceBoost(sourceUrl)) total += 0.22;

// ALL verified social platforms (not just FB)
if (isVerifiedAccountBoost(sourceUrl)) {
  total += 0.15;
}

// extra boost if verified AND news identity
if (identity && isVerifiedAccountBoost(sourceUrl)) {
  total += 0.12;
}

  // FIX: was crashing before because isFacebook was never defined
  const isFacebook = socialUrl.includes("facebook.com");

  if (isFacebook && isVerifiedAccountBoost(sourceUrl)) {
    total += 0.10;
  }

  if (!isFacebook && identity && isVerifiedAccountBoost(sourceUrl)) {
    total += 0.10;
  }

  if (identity && sourceComponent > 0.8) total += 0.05;

  /**
   * FINAL CLAMP (ONLY ONCE)
   */
  total = Math.max(0, Math.min(1, total));
  if (!isFinite(total)) total = 0;  

  const score = Math.round(total * 100);

  return {
    score,
    verdict: getVerdict(score),
    label: getLabel(score),
    breakdown: {
      source: sourceComponent,
      content: contentComponent,
      fact_check: {
        score: factCheckComponent,
        verdict: factCheckResult.verdict,
        label: factCheckResult.label
      },
      sentiment: sentimentComponent,
      ai: aiComponent,
      social: socialComponent,
      identity
    }
  };
}
function getTrustedBoost(sourceUrl, trustedSources) {
  if (!sourceUrl) return 0;

  const u = sourceUrl.toLowerCase();

  const isTrusted = trustedSources.some(source => {
    const domains = Array.isArray(source.domains) ? source.domains : [];
    return domains.some(d => u.includes(d));
  });

  return isTrusted ? 0.05 : 0;
}

function getVerifiedSocialBoost(sourceUrl, trustedSources) {
  if (!sourceUrl) return false;

  const u = sourceUrl.toLowerCase();

  const isSocial =
    u.includes("facebook.com") ||
    u.includes("instagram.com") ||
    u.includes("x.com") ||
    u.includes("twitter.com");

  if (!isSocial) return false;

  return trustedSources.some(source => {
    const socials = Array.isArray(source.social) ? source.social : [];
    return socials.some(s => u.includes(s));
  });
}

module.exports = { computeScore };