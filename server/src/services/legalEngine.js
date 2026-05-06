const laws = require('../data/ph_laws.json');

/**
 * -------------------------
 * SAFE LAW MATCHING ENGINE (REVISED)
 * -------------------------
 * - No forced fallback laws
 * - Score-aware filtering
 * - Prevents false triggers on low-quality content
 * - Clean PH law matching only
 */

function matchLaws(text = "", credibilityScore = 100) {
  if (!text || typeof text !== "string") return [];

  const normalized = text.toLowerCase();

  /**
   * ❌ HARD GUARD:
   * If content is extremely low credibility,
   * DO NOT apply legal interpretation (prevents noise like SIM law)
   */
  if (credibilityScore < 20) {
    return [];
  }

  /**
   * 🔥 NEW RULE:
   * If credibility is low (<40), allow broader law triggering
   */
  const lowCredibilityMode = credibilityScore < 40;

  /**
   * -------------------------
   * SCORE-AWARE LAW FILTERING
   * -------------------------
   */
  const allowedRiskLevels =
    credibilityScore < 40
      ? ["high", "medium"]
      : credibilityScore < 70
      ? ["medium", "low"]
      : ["low", "medium", "high"];

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

  /**
   * -------------------------
   * FILTER VALID MATCHES
   * -------------------------
   */
  const sortedMatches = scoredLaws
    .filter((l) =>
      (
        l.matchCount > 0 || lowCredibilityMode
      ) &&
      allowedRiskLevels.includes(l.risk_level)
    )
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(({ law, explanation, risk_level }) => ({
      law,
      explanation,
      risk_level
    }));

  /**
   * ❌ NO FALLBACK LAW
   */
  if (sortedMatches.length === 0) {
    return [];
  }

  return sortedMatches;
}

module.exports = {
  matchLaws,
};