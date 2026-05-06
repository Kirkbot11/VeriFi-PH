function mapFactCheckVerdict(verdict, sourceUrl, identity, credibilityScore) {
  // 1. If real fact-check exists
  if (verdict) {
    const v = String(verdict).toLowerCase();

    if (v.includes("false") || v.includes("fake") || v.includes("debunk")) {
      return {
        verdict: "False / Debunked by fact-check sources",
        score: 0.1,
        label: "false"
      };
    }

    if (v.includes("misleading") || v.includes("partially") || v.includes("mixed")) {
      return {
        verdict: "Misleading / Partially true",
        score: 0.35,
        label: "mixed"
      };
    }

    if (v.includes("true") || v.includes("verified") || v.includes("correct")) {
      return {
        verdict: "Verified as True by fact-check sources",
        score: 0.85,
        label: "true"
      };
    }
  }

  // 2. NO FACT CHECK AVAILABLE → DO INTELLIGENT INFERENCE
  let inferredVerdict = "No direct fact-check found";

  if (identity) {
    inferredVerdict =
      credibilityScore >= 70
        ? `Likely reliable based on verified outlet (${identity})`
        : `Source is known outlet (${identity}) but claim is unverified`;
  } else {
    inferredVerdict =
      credibilityScore >= 70
        ? "Likely credible based on source reputation and content signals"
        : "Potentially unreliable — no verification from trusted fact-check sources";
  }

  return {
    verdict: inferredVerdict,
    score: 0.55,
    label: "inferred"
  };
}