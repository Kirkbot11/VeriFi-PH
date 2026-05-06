const laws = require('../data/ph_laws.json');

/**
 * -------------------------
 * SAFE LAW MATCHING ENGINE
 * -------------------------
 * - No forced fallback laws
 * - Score-aware filtering
 * - Reduced false positives
 */

function matchLaws(text = "", credibilityScore = 100) {
  if (!text || typeof text !== "string") return [];

  const normalized = text.toLowerCase();

  /**
   * ❌ BLOCK LOW-CREDIBILITY CONTENT FROM TRIGGERING LAWS
   * This fixes your SIM law issue at 0%
   */
  if (credibilityScore < 20) {
    return [];
  }

  const scoredLaws = laws.map((law) => {
    const keywords = Array.isArray(law.keywords) ? law.keywords : [];

    const keywordMatches = keywords.filter((keyword) => {
      if (!keyword) return false;
      return normalized.includes(keyword.toLowerCase());
    });

    return {
      law: law.law,
      explanation: law.explanation,
      risk_level: law.risk_level,
      matchCount: keywordMatches.length
    };
  });

  const sortedMatches = scoredLaws
    .filter((l) => l.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(({ law, explanation, risk_level }) => ({
      law,
      explanation,
      risk_level
    }));

  /**
   * ✅ IMPORTANT FIX:
   * NO MORE FAKE FALLBACK LAW
   */
  if (sortedMatches.length === 0) {
    return [];
  }

  return sortedMatches;
}

module.exports = {
  matchLaws,
};