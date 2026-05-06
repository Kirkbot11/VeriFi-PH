const { fetchHTML, extractMainContent } = require('../services/contentExtractor');
const cacheService = require('../services/cacheService');
const aiService = require('../services/aiService');
const factCheckService = require('../services/factCheckService');
const legalEngine = require('../services/legalEngine');
const credibilityScorer = require('../services/credibilityScorer');
const explanationGenerator = require('../services/explanationGenerator');
const mediaAIDetector = require('../services/mediaAIDetector');
const resolveSocialUrl = require('../services/socialResolver');

let forcedLegalRisk = null;

function isValidUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsedUrl = new URL(value.trim());
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function getCacheKey(url) {
  return `analyze:${url}`;
}

function buildFallbackContent(url, reason) {
  return {
    title: 'Limited analysis',
    excerpt: reason,
    text: `Could not fully extract content from: ${url}`,
    images: [],
    videos: [],
  };
}

async function analyzeUrl(req, res) {
  try {
    const { url } = req.body || {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const cacheKey = getCacheKey(url);
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json({ ...cached, cache_hit: true });

    let content;
    let fetchWarning = null;

    /**
     * -------------------------
     * CONTENT EXTRACTION
     * -------------------------
     */
    try {
      if (
        url.includes("facebook.com") ||
        url.includes("instagram.com") ||
        url.includes("x.com") ||
        url.includes("twitter.com")
      ) {
        const social = await resolveSocialUrl(url);

        if (social.resolvedUrl) {
          const html = await fetchHTML(social.resolvedUrl);
          content = extractMainContent(html, social.resolvedUrl);
        } else {
          content = {
            title: social.title,
            excerpt: social.description,
            text: social.description,
            images: [],
            videos: []
          };
        }
      } else {
        const html = await fetchHTML(url);
        content = extractMainContent(html, url);
      }
    } catch (err) {
      fetchWarning = 'Fetch failed, using fallback content';
      content = buildFallbackContent(url, fetchWarning);
    }

    if (!content.text) {
      return res.status(400).json({ error: 'No content extracted' });
    }

    /**
     * -------------------------
     * CORE ANALYSIS (NO LEGAL HERE)
     * -------------------------
     */
    const [aiDetection, sentiment, riskClassification, factCheck] =
      await Promise.all([
        aiService.detectAIText(content.text),
        aiService.getSentiment(content.text),
        aiService.classifyRisk(content.text, [
          'misinformation',
          'political',
          'legal risk',
          'neutral'
        ]),
        factCheckService.searchFactChecks(content.text, content.title),
      ]);

    /**
     * -------------------------
     * MULTIMODAL AI DETECTION
     * -------------------------
     */
    const multimodalAiDetection =
      await mediaAIDetector.detectAIGeneratedContent({
        sourceUrl: url,
        content,
        aiTextProbability: Number(aiDetection?.overall_probability || 0)
      });

    /**
     * -------------------------
     * CREIDBILITY SCORE (IMPORTANT FIRST)
     * -------------------------
     */
    const credibility = credibilityScorer.computeScore({
      aiProbability: multimodalAiDetection.overall_probability,
    factCheckVerdict: factCheck?.verdict || 'unknown',
      sentimentScore: sentiment.score,
      sourceUrl: url,
      claim: content.title,
      articleContent: [content.text, content.excerpt],
    });

    const score = credibility.score;

    /**
     * -------------------------
     * FACT CHECK LABELING
     * -------------------------
     */
    const factCheckVerdict =
      factCheck?.sources?.length
        ? score >= 75
          ? "Likely aligns with verified information"
          : score >= 50
          ? "Mixed or partially verified information"
          : "Low credibility — no strong fact-check support"
        : "No fact-check coverage available";

    /**
     * -------------------------
     * LEGAL ENGINE (NOW SAFE)
     * -------------------------
     */
   let legalInsights = [];

if (score >= 30) {
  legalInsights = await legalEngine.matchLaws(
    `${content.title} ${content.excerpt} ${content.text}`,
    score
  );
}

  const safeScore = typeof score === "number" ? score : 0;

const legalRiskLevel =
  legalInsights && legalInsights.length > 0
    ? (legalInsights.some(l => (l.risk_level || "").includes("critical"))
        ? "critical"
        : legalInsights.some(l => (l.risk_level || "").includes("high"))
        ? "high"
        : legalInsights.some(l => (l.risk_level || "").includes("medium"))
        ? "medium"
        : "low")
    : score < 40
    ? "critical"
    : score < 60
    ? "high"
    : score < 80
    ? "medium"
    : "low";
    /**
     * -------------------------
     * ACTION SYSTEM
     * -------------------------
     */
    let requiredAction = null;

    if (score < 40) {
      requiredAction = {
        level: "critical",
        message: "This content is highly unreliable.",
        actions: [
          "Do not share",
          "Verify with trusted news outlets",
          "Check official sources",
          "Flag as misinformation"
        ]
      };
    } else if (score < 60) {
      requiredAction = {
        level: "warning",
        message: "This content may be misleading.",
        actions: [
          "Cross-check sources",
          "Avoid sharing as fact"
        ]
      };
    }

    /**
     * -------------------------
     * EXPLANATION
     * -------------------------
     */
 const explanation = await explanationGenerator.generateExplanation({
      title: content.title,
      excerpt: content.excerpt,
      aiDetection,
      multimodalAiDetection,
      sentiment,
      factCheck,
      legalInsights,
      credibilityScore: score,
      verdict: credibility.verdict,
    });

    /**
     * -------------------------
     * FALLBACK LEGAL NORMALIZER
     * -------------------------
     */
    const normalizedLegalInsights =
      Array.isArray(legalInsights) && legalInsights.length > 0
        ? legalInsights
        : [{
            law: "No applicable Philippine law detected",
            explanation: "No matching keywords found in content analysis.",
            risk_level: "low"
          }];

    if (forcedLegalRisk) {
      normalizedLegalInsights.unshift(forcedLegalRisk);
    }

    /**
     * -------------------------
     * FINAL RESPONSE
     * -------------------------
     */
    const result = {
      url,

      credibility_score: score,
      credibility_label: credibility.label,
      verdict: credibility.verdict,

      ai_detection: aiDetection,
      sentiment,

      fact_check: {
        verdict: factCheckVerdict,
        sources: factCheck?.sources || [],
      },

      legal_insights: normalizedLegalInsights,
      legal_risk_level: legalRiskLevel,

      required_action: requiredAction,

      explanation,
      fetch_warning: fetchWarning,
    };

    cacheService.set(cacheKey, result);
    return res.json(result);

  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Server error'
    });
  }
}

module.exports = {
  analyzeUrl,
};