# CLAUDE.md

## Project Overview

Personal academic website for Ming Gu, deployed via **GitHub Pages** at **gmis.me**. Chat-first interface where visitors interact with an AI assistant that knows about Ming's research, teaching, and academic work. Terminal/hacker aesthetic with dark theme and green accents.

## Tech Stack

- **Pure HTML/CSS/JS** — no build tools, no dependencies, no package manager
- **AI Chat**: OpenRouter API (free models: Gemini 2.0 Flash, Llama 3.3 70B)
- **Hosting**: GitHub Pages (auto-deploys from `master` branch)
- **Streaming**: Server-Sent Events (SSE) for real-time AI responses

## Directory Structure

```
├── index.html          # Single-page chat-first website (HTML + CSS + JS all inline)
├── CNAME               # Custom domain config (gmis.me) — do not modify
├── .gitignore           # Git ignore rules
├── worker/              # Cloudflare Worker (API proxy)
│   └── chat-proxy.js   # Proxies chat requests, injects API key server-side
├── gmis_files/          # Assets directory (CV PDF)
│   └── CV_MingGu.pdf   # CV document
├── sk.js               # Surfingkeys browser config (NOT part of site)
└── README.md           # Project description
```

## Architecture

- **Single file**: Everything is in `index.html` — HTML structure, CSS styles, and JavaScript
- **Chat flow**: User sends message → JS calls Cloudflare Worker proxy → Worker adds API key & forwards to OpenRouter → streaming response rendered in real-time
- **System prompt**: Contains all of Ming's bio, research, teaching, and contact info (baked into JS)
- **Fallback**: If primary model (Gemini) fails, falls back to Llama 3.3. If both fail, shows static links
- **Markdown**: Simple regex-based renderer for bold, links, lists, code blocks
- **Nav links**: Clicking About/Research/Teaching sends a pre-written question to the chat

## Development Workflow

- Edit `index.html` directly — no build step needed
- Open in browser to test locally
- Push to `master` for deployment

## API Key Setup

The OpenRouter API key is **never exposed to the browser**. It lives server-side in a Cloudflare Worker:

1. **Worker**: `worker/chat-proxy.js` — proxies chat requests to OpenRouter, injecting the API key
2. **Environment variable**: The key is set as `OPENROUTER_API_KEY` in the Cloudflare Worker dashboard
3. **Frontend**: `index.html` sends requests to the Worker URL (no key needed client-side)

To deploy the worker:
1. Create a Worker at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Paste `worker/chat-proxy.js`
3. Set env var `OPENROUTER_API_KEY` to your OpenRouter key
4. Update `WORKER_URL` in `index.html` to match your worker URL

## Key Notes

- **CNAME** must remain as `gmis.me`
- **`sk.js`** is unrelated to the website (personal browser extension config)
- **Never commit API keys** to this repository
