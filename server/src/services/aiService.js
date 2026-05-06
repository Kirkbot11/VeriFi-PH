const axios = require('axios');

/**
 * -------------------------
 * CLOUDLFARE AI CORE
 * -------------------------
 */
async function callCloudflareModel(model, input) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error('CLOUDFLARE_MISSING_ENV');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await axios.post(
    endpoint,
    { prompt: input },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data?.result?.response || '';
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
 * AI DETECTION
 * -------------------------
 */
function interpretAiDetection(output) {
  const normalized = (output || '').toLowerCase();

  if (normalized.includes('ai-generated') || normalized.includes('likely ai')) {
    return {
      is_ai: true,
      confidence: normalizeProbability(output) || 75,
    };
  }

  if (normalized.includes('human') || normalized.includes('likely human')) {
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
Analyze this text and determine:
1. Is it AI-generated?
2. Confidence (0-100%)

Text:
${text}
`;

    const output = await callCloudflareModel(
      '@cf/meta/llama-3-8b-instruct',
      prompt
    );

    const interpreted = interpretAiDetection(output);

    return {
      overall_probability: interpreted.confidence,
      text: interpreted,
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
 * SENTIMENT ANALYSIS
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

  const probability = normalizeProbability(output) / 100;

  return {
    label: 'UNKNOWN',
    score: probability || 0.5,
  };
}

async function getSentiment(text) {
  if (!text) {
    return { label: 'UNKNOWN', score: 0.5 };
  }

  try {
    const output = await callCloudflareModel(
      '@cf/huggingface/distilbert-sst-2-int8',
      text
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
 * RISK CLASSIFICATION
 * -------------------------
 */
async function classifyRisk(text, candidateLabels = []) {
  if (!text || candidateLabels.length === 0) {
    return { label: 'unknown', confidence: 0 };
  }

  const prompt = `
Classify the text into one of these categories:
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