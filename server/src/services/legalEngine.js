const laws = require('../data/ph_laws.json');

function matchLaws(text = "", credibilityScore = 100) {
  if (!text) return [];

  const normalized = text.toLowerCase();

  const scoredLaws = laws.map((law) => {
    const keywordMatches = law.keywords?.filter((keyword) => {
      const k = keyword.toLowerCase();
      return normalized.includes(k);
    }) || [];

    return {
      law: law.law,
      explanation: law.explanation,
      risk_level: law.risk_level,
      matchCount: keywordMatches.length
    };
  });

  const sortedMatches = scoredLaws
    .filter(l => l.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(({ law, explanation, risk_level }) => ({
      law,
      explanation,
      risk_level
    }));

  /**
   * ✅ PURE JSON FALLBACK (NO HARD CODED LAW)
   */
  if (sortedMatches.length === 0) {
    // pick LOWEST risk law OR first law in JSON
    const fallback = laws.find(l => l.risk_level === "low") || laws[0];

    return [
      {
        law: fallback.law,
        explanation: fallback.explanation,
        risk_level: fallback.risk_level
      }
    ];
  }

  return sortedMatches;
}

module.exports = {
  matchLaws,
};