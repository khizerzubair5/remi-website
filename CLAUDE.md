# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Remi is a static marketing website for a Canvas deadline SMS reminder service targeting GMU students. It is a single-page site deployed on Vercel with no build step.

## Local development

```
node serve.js        # starts local server at http://localhost:4200
```

`serve.js` is a minimal Node.js static file server for local preview only. Production runs directly on Vercel (`vercel.json` sets `cleanUrls: true`).

## Architecture

- **[index.html](index.html)** — the entire site. One HTML file with five sections: nav, hero, how-it-works, phone preview carousel, founder, waitlist form, footer.
- **[css/style.css](css/style.css)** — all styles, no preprocessor.
- **[js/app.js](js/app.js)** — all client-side JS: scroll animations (`IntersectionObserver` on `.fade-up`), phone message carousel (auto-advances every 4 s, clickable labels), and waitlist form submission.
- **[privacy.html](privacy.html)** / **[terms.html](terms.html)** — standalone legal pages linked from the footer.

## Backend integration

The waitlist form POSTs to `POST /api/waitlist` with `{ name, email, phone }`. The API base is:
- **Local:** `http://localhost:3000`
- **Production:** `https://remi-backend-production-039a.up.railway.app`

Phone numbers are normalised to E.164 (`+1XXXXXXXXXX`) client-side before submission.

## Testimonials section

A testimonials section exists in [index.html](index.html) but is commented out — uncomment once real student quotes are collected.
