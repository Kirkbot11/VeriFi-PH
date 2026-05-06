const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

function resolveUrl(rawValue, baseUrl) {
  if (!rawValue) return null;
  try {
    return new URL(rawValue, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeMediaUrls(urls) {
  return Array.from(new Set(urls.filter(Boolean)));
}

function browserHeaders(url) {
  const origin = new URL(url).origin;
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Referer: origin,
    Origin: origin,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Upgrade-Insecure-Requests': '1',
  };
}

function isSocialUrl(url) {
  return (
    url.includes('facebook.com') ||
    url.includes('instagram.com') ||
    url.includes('x.com') ||
    url.includes('twitter.com') ||
    url.includes('tiktok.com')
  );
}

function inferMediaTypeFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const path = `${parsed.pathname || ''}`.toLowerCase();
    const query = `${parsed.search || ''}`.toLowerCase();

    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(path)) return 'video';
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(path)) return 'image';

    if (/format=(mp4|webm|mov|m4v)/i.test(query)) return 'video';
    if (/format=(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(query)) return 'image';

    if (/\b(video|stream|clip)\b/i.test(path)) return 'video';
    if (/\b(image|img|photo)\b/i.test(path)) return 'image';
  } catch {
    return null;
  }

  return null;
}

function extractMedia(html, baseUrl) {
  const $ = cheerio.load(html);
  const imageUrls = [];
  const videoUrls = [];

  $('img[src]').each((_, el) => {
    const src = resolveUrl($(el).attr('src'), baseUrl);
    if (src) imageUrls.push(src);
  });

  $('video[src], source[src], iframe[src]').each((_, el) => {
    const src = resolveUrl($(el).attr('src'), baseUrl);
    if (src) videoUrls.push(src);
  });

  return {
    images: normalizeMediaUrls(imageUrls),
    videos: normalizeMediaUrls(videoUrls),
  };
}

/* =========================
   FETCH HTML
========================= */
async function fetchHTML(url) {
  try {
    if (isSocialUrl(url)) {
      // IMPORTANT: do not break social links
      return `<html><body><p>Social media page detected. Content is dynamic and restricted.</p></body></html>`;
    }

    const inferredMediaType = inferMediaTypeFromUrl(url);
    if (inferredMediaType) {
      const tag = inferredMediaType === 'video' ? 'video' : 'img';
      return `<html><body><${tag} src="${url}" controls></${tag}></body></html>`;
    }

    const response = await axios.get(url, {
      timeout: 12000,
      headers: browserHeaders(url),
      maxRedirects: 5,
    });

    return response.data;
  } catch (error) {
    const fallback = isSocialUrl(url)
      ? `<html><body><p>Social media content cannot be fully extracted.</p></body></html>`
      : null;

    if (fallback) return fallback;

    const err = new Error(
      'Could not fetch content from URL. The source may block automated access.'
    );
    err.status = 400;
    err.code = 'URL_UNREACHABLE';
    throw err;
  }
}

/* =========================
   EXTRACT MAIN CONTENT
========================= */
function extractMainContent(html, baseUrl) {
  const dom = new JSDOM(html, { url: baseUrl });

  let article = null;

  try {
    article = new Readability(dom.window.document).parse();
  } catch {}

  const media = extractMedia(html, baseUrl);

  const title =
    article?.title || dom.window.document.title || 'Social Media Post';

  const excerpt = article?.excerpt || '';

  const textContent =
    article?.textContent?.trim() ||
    dom.window.document.querySelector('meta[name="description"]')?.content ||
    title ||
    excerpt ||
    'No extractable text (social media restricted)';

  const contentHtml = article?.content || '';

  return {
    title,
    excerpt,
    text: textContent,
    content_html: contentHtml,
    images: media.images,
    videos: media.videos,
  };
}

module.exports = {
  fetchHTML,
  extractMainContent,
};