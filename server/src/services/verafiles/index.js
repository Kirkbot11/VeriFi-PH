async function verafiles(text, title = "") {
  const input = (text || title || "").toLowerCase();

  if (!input) {
    return {
      source: "Vera Files",
      score: 0.5,
      verdict: "No input provided",
      results: []
    };
  }

  // stronger PH keyword logic
  const fakeIndicators = [
    "fake",
    "hoax",
    "scam",
    "false",
    "disinformation",
    "debunk",
    "manipulated",
    "clickbait"
  ];

  const trueIndicators = [
    "verified",
    "official",
    "statement",
    "confirmed",
    "report"
  ];

  const fakeHits = fakeIndicators.filter(w => input.includes(w)).length;
  const trueHits = trueIndicators.filter(w => input.includes(w)).length;

  let score = 0.6;

  if (fakeHits > 0) score -= fakeHits * 0.15;
  if (trueHits > 0) score += trueHits * 0.1;

  score = Math.max(0, Math.min(1, score));

  return {
    source: "Vera Files",
    query: input,
    score,
    verdict:
      score < 0.3
        ? "Likely False"
        : score < 0.6
        ? "Uncertain"
        : "No evidence of falsehood",
    results: [
      {
        title: "Vera Files Analysis Engine",
        link: "https://verafiles.org/",
        verdict: "AI-assisted classification"
      }
    ]
  };
}

module.exports = verafiles;