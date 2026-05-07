# VeriFi-PH

VeriFi-PH is a link-based social post verification system. It combines a React + Vite client, a Node.js + Express backend, and a Chrome extension-style content script to analyze posts and return a credibility assessment with supporting context.

## What it does

- Verifies social and news links from platforms like Facebook, X/Twitter, Instagram, TikTok, and YouTube.
- Sends link analysis requests to the backend at `POST /api/v1/analyze`.
- Returns credibility scoring, fact-check context, legal insights, and a short explanation.
- Exposes a health check at `GET /health`.
- Uses Socket.IO for real-time event handling on the server.

## Project Structure

- `client/` - React frontend built with Vite and Tailwind CSS.
- `server/` - Express backend with analysis routes, scoring logic, fact-check helpers, and legal context data.
- `public/` - Chrome extension assets such as `manifest.json` and `content.js`.

## Requirements

- Node.js 18 or newer
- npm

## Setup

Install dependencies for both parts of the app:

```bash
cd client
npm install

cd ../server
npm install
```

## Run Locally

Start the backend from the `client` package scripts:

```bash
cd client
npm run dev-backend
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

The backend listens on port `4000` by default, and the frontend runs on Vite's default port.

## Backend API

### `POST /api/v1/analyze`

Analyzes a URL and returns the credibility result.

Example request:

```json
{
  "url": "https://example.com/post"
}
```

### `GET /health`

Returns a simple health status payload for uptime checks.

## Environment Variables

The backend reads local values from `server/.env.local.dev`.

Common variables include:

- `PORT`
- `NODE_ENV`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_AI_GATEWAY`
- `GNEWS_API_KEY`
- `GOOGLE_FACT_CHECK_API_KEY`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `CACHE_TTL_SECONDS`

## Chrome Extension Assets

The `public/` folder contains the extension manifest and content script used to inject verification behavior on supported sites.

## Deployment

The repository includes `vercel.json` for frontend deployment support. The backend can also be hosted separately on a Node.js platform such as Render or Fly.io.

## Notes

- The backend is rate limited and caches results to reduce repeated work.
- The analysis flow is designed to be explainable rather than a black box.
- Legal references are informational and not legal advice.
