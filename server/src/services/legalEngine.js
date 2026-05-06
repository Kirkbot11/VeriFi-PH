const laws = require('../data/ph_laws.json');

function matchLaws(text = "", credibilityScore = 100, url = "") {
  if (!text && !url) return [];

  const normalizedText = (text || "").toLowerCase();
  const normalizedUrl = (url || "").toLowerCase();
  const combined = `${normalizedText} ${normalizedUrl}`;

  const scoredLaws = laws.map((law) => {
    const keywords = Array.isArray(law.keywords) ? law.keywords : [];

    const keywordMatches = keywords.filter((keyword) => {
      if (!keyword) return false;
      return combined.includes(keyword.toLowerCase());
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
   * 🔥 IMPORTANT FIX:
   * If HIGH or CRITICAL risk → allow weak URL-based trigger
   */
  if (sortedMatches.length === 0 && credibilityScore < 60) {
    const urlSignals = combined;

    const fallback = laws.find((law) =>
      law.keywords.some((k) => urlSignals.includes(k.toLowerCase()))
    );

    if (fallback) {
      return [
        {
          law: fallback.law,
          explanation: fallback.explanation,
          risk_level: fallback.risk_level
        }
      ];
    }
  }

  return sortedMatches;
}

module.exports = { matchLaws };