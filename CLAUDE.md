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
├── gmis_files/          # Assets directory (CV PDF)
│   └── CV_MingGu.pdf   # CV document (if uploaded)
├── sk.js               # Surfingkeys browser config (NOT part of site)
└── README.md           # Project description
```

## Architecture

- **Single file**: Everything is in `index.html` — HTML structure, CSS styles, and JavaScript
- **Chat flow**: User sends message → JS calls OpenRouter API with streaming → tokens rendered in real-time
- **System prompt**: Contains all of Ming's bio, research, teaching, and contact info (baked into JS)
- **Fallback**: If primary model (Gemini) fails, falls back to Llama 3.3. If both fail, shows static links
- **Markdown**: Simple regex-based renderer for bold, links, lists, code blocks
- **Nav links**: Clicking About/Research/Teaching sends a pre-written question to the chat

## Development Workflow

- Edit `index.html` directly — no build step needed
- Open in browser to test locally
- Push to `master` for deployment

## Key Notes

- **OpenRouter API key** is embedded client-side in `index.html` (accepted risk — free tier only)
- **CNAME** must remain as `gmis.me`
- **`sk.js`** is unrelated to the website (personal browser extension config)
- **No `.env` or secrets file** — API key is in source code by design (free tier)
