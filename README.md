# PT Website Template

A parameterized physical therapy website template. **All client-specific content lives in `content.json`** — the design lives in `build.js` + `styles.css` and is identical across every client site. This is the foundation for an automated pipeline where a client form fills in `content.json` and the site builds & deploys itself.

## How it works

```
content.json  ──►  build.js  ──►  dist/index.html + dist/styles.css
   (content)        (renderer)      (the deployed site)
```

`build.js` is **pure Node — no `npm install` required.** It reads `content.json`, renders static HTML, injects brand colors, and copies anything in `assets/`.

## Local development

```bash
node build.js          # render dist/
npm run serve          # build + preview at http://localhost:8080
```

## Per-client setup

1. Copy this template to a new repo for the client.
2. Replace `content.json` with the client's content (this is what AI generates from the intake form).
3. Drop the client's photos into `assets/` (`hero.jpg`, `step-1.jpg`, etc. — see `content.json` for the filenames referenced).
4. Connect the repo to Netlify. Netlify runs `node build.js` and publishes `dist/` automatically on every push.

## Files

| File | Purpose |
|------|---------|
| `content.json` | **All client content.** The only file the automation writes. |
| `build.js` | Static site generator (zero dependencies). |
| `styles.css` | Shared design system. Colors come from `content.json` via `:root`. |
| `netlify.toml` | Netlify build config (Node 20, `node build.js`, publish `dist/`). |
| `assets/` | Client images. Missing images fall back to brand-colored placeholders. |
| `serve.js` | Local preview server (dev only). |

## Sections

Hero · Problem · Empathy · 3-step process · Lifestyle affirmation · Services · Results · CTA band · Testimonials · Lead magnet · Footer — mirroring the reference site structure.
