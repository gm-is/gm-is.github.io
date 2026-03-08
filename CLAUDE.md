# CLAUDE.md

## Project Overview

Personal static website for Ming Gu, deployed via **GitHub Pages** at **gmis.me**. Features a terminal-style interactive homepage, an AI chatbot, research visualizations, and curated content collections.

## Tech Stack

- **Main site**: Vanilla HTML, CSS, JavaScript
- **Libraries**: jQuery 3.3.1, jQuery Terminal (terminal UI), Alltius SDK (chatbot)
- **Latent Clusters app** (`latent-clusters/`): React + Vite (self-contained, pre-built)
- **Hosting**: GitHub Pages (auto-deploys from `master` branch)

## Directory Structure

```
├── index.html                          # Main terminal-style homepage
├── CNAME                               # Custom domain config (gmis.me) — do not modify
├── Everything-All-At-Once.md           # Curated "Every X All At Once" visualization collection
├── gmis_files/                         # Shared JS/CSS dependencies
│   ├── jquery-3.3.1.min.js
│   ├── jquery.terminal.min.js
│   ├── jquery.terminal-src.css
│   └── alltius.js                      # AI chatbot SDK loader
├── latent-clusters/                    # Self-contained React/Vite visualization app
│   └── gifs-latent-clusters.html       # Entry point (pre-built, no dev server needed)
├── Animated_GIF_Examples_and_their_Static_Counterparts.htm  # GIF analysis page
├── Animated_GIF_Examples_and_their_Static_Counterparts_files/  # Supporting assets
├── popGIFs-7289.html                   # Pandas DataFrame HTML export
├── trendgif-1520.html                  # Pandas DataFrame HTML export
├── sk.js                               # Surfingkeys browser extension config (NOT part of site)
├── image001.png ... image008.png       # Image assets (sequential naming)
└── bot                                 # Bot verification file
```

## Development Workflow

- **No build step** for the main site. Edit HTML/JS/CSS files directly.
- **No package manager** (no `package.json` at root, no `node_modules`).
- **No linting, formatting, or test frameworks** configured.
- **No CI/CD pipelines** — GitHub Pages deploys automatically on push to `master`.
- The `latent-clusters/` app is pre-built; its bundled JS/CSS should not be hand-edited.

## Conventions

- **Inline styles** are used throughout `index.html` (no external stylesheet for main page).
- **Image naming**: Sequential numbering (`image001.png`, `image002.png`, ...).
- **Terminal commands** in `index.html` use single-letter shortcuts: `b` (bio), `r` (research), `t` (teaching), `o` (other/chatbot).
- **Dependencies are vendored** in `gmis_files/` — not fetched from a CDN or package manager.

## Deployment

Push to `master` → GitHub Pages serves the site at `gmis.me` automatically.

## Important Notes

- **No `.gitignore`** exists — be careful not to commit sensitive or unnecessary files.
- **`CNAME`** must remain as `gmis.me` — do not modify or delete it.
- **`sk.js`** is a personal Surfingkeys browser extension config, unrelated to the website.
- The chatbot uses the Alltius API (`app.alltius.ai`) — API keys are embedded in `index.html`.
