const axios = require('axios');

/**
 * -------------------------
 * CLOUDLFARE AI CORE (FIXED)
 * -------------------------
 */
async function callCloudflareModel(model, input) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

  try {
    const response = await axios.post(
      endpoint,
      { prompt: input },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const result = response.data?.result;

    // 🔥 FIX: handle all possible Cloudflare formats
    return (
      result?.response ||
      result?.output ||
      result?.result ||
      JSON.stringify(result || "")
    );

  } catch (err) {
    console.error("Cloudflare AI error:", err.message);
    return "";
  }
} 

/**
 * -------------------------
 * NORMALIZATION HELPERS
 * -------------------------
 */
function normalizeProbability(raw) {
  if (raw == null) return 0;

  const match = String(raw).match(/(\d+(?:\.\d+)?)%?/);
  if (match) {
    const value = Number(match[1]);
    if (!Number.isNaN(value)) {
      return Math.max(0, Math.min(100, value));
    }
  }

  return 0;
}

/**
 * -------------------------
 * AI DETECTION (IMPROVED)
 * -------------------------
 */
function interpretAiDetection(output) {
  const normalized = String(output || "").toLowerCase();

  // stronger detection rules
  const aiSignals = ["ai-generated", "artificial", "machine", "llm"];
  const humanSignals = ["human-written", "human", "authentic"];

  if (aiSignals.some(w => normalized.includes(w))) {
    return {
      is_ai: true,
      confidence: Math.max(normalizeProbability(output), 70),
    };
  }

  if (humanSignals.some(w => normalized.includes(w))) {
    return {
      is_ai: false,
      confidence: 100 - (normalizeProbability(output) || 20),
    };
  }

  const probability = normalizeProbability(output);

  return {
    is_ai: probability > 50,
    confidence: probability || 50,
  };
}

async function detectAIText(text) {
  if (!text) {
    return {
      overall_probability: 0,
      text: { is_ai: false, confidence: 0 },
    };
  }

  try {
    const prompt = `
You are an AI detection classifier.

Return ONLY valid JSON. No explanations. No extra text.

Format:
{
  "is_ai": true or false,
  "confidence": number from 0 to 100
}

Rules:
- Output must be valid JSON
- Do not include any text outside JSON
- Be strict and consistent

Text:
${text}
`;

    const output = await callCloudflareModel(
      '@cf/meta/llama-3-8b-instruct',
      prompt
    );

 let parsed = null;

try {
  const cleaned = output
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  parsed = JSON.parse(cleaned);
} catch (e) {
  parsed = null;
}

    if (parsed && typeof parsed === 'object') {
      return {
        overall_probability: parsed.confidence ?? 0,
        text: {
          is_ai: parsed.is_ai ?? false,
          confidence: parsed.confidence ?? 0,
        },
      };
    }

    // fallback if model fails JSON format
    const fallbackConfidence = normalizeProbability(output);

    return {
      overall_probability: fallbackConfidence,
      text: interpretAiDetection(output),
    };

  } catch (error) {
    return {
      overall_probability: 0,
      text: { is_ai: false, confidence: 0 },
      error: 'AI_SERVICE_UNAVAILABLE',
    };
  }
}
/**
 * -------------------------
 * SENTIMENT ANALYSIS (FIXED - NO MORE FAILING MODEL)
 * -------------------------
 */
function interpretSentiment(output) {
  const normalized = (output || '').toLowerCase();

  if (normalized.includes('negative')) {
    return { label: 'NEGATIVE', score: 0.2 };
  }

  if (normalized.includes('positive')) {
    return { label: 'POSITIVE', score: 0.8 };
  }

  if (normalized.includes('neutral')) {
    return { label: 'NEUTRAL', score: 0.55 };
  }

  return {
    label: 'UNKNOWN',
    score: 0.5,
  };
}

async function getSentiment(text) {
  if (!text) {
    return { label: 'UNKNOWN', score: 0.5 };
  }

  try {
    const prompt = `
Classify sentiment as ONLY:
positive, negative, or neutral

Text:
${text}
`;

    const output = await callCloudflareModel(
      '@cf/meta/llama-3-8b-instruct',
      prompt
    );

    return interpretSentiment(output);
  } catch (error) {
    return {
      label: 'UNKNOWN',
      score: 0.5,
      error: 'AI_SERVICE_UNAVAILABLE',
    };
  }
}

/**
 * -------------------------
 * RISK CLASSIFICATION (CLEANED)
 * -------------------------
 */
async function classifyRisk(text, candidateLabels = []) {
  if (!text || candidateLabels.length === 0) {
    return { label: 'unknown', confidence: 0 };
  }

  const prompt = `
Classify this text into ONE category ONLY:

Options:
${candidateLabels.join(', ')}

Return ONLY the category name.

Text:
${text}
`;

  try {
    const output = await callCloudflareModel(
      '@cf/meta/llama-3-8b-instruct',
      prompt
    );

    const normalized = (output || '').toLowerCase();

    const chosen =
      candidateLabels.find(label =>
        normalized.includes(label.toLowerCase())
      ) || 'unknown';

    return {
      label: chosen,
      confidence: normalizeProbability(output) || 50,
    };
  } catch (error) {
    return {
      label: 'unknown',
      confidence: 0,
      error: 'AI_SERVICE_UNAVAILABLE',
    };
  }
}

/**
 * -------------------------
 * EXPORTS
 * -------------------------
 */
module.exports = {
  callCloudflareModel,
  detectAIText,
  getSentiment,
  classifyRisk,
};