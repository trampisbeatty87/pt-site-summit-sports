#!/usr/bin/env node
/*
 * build.js — zero-dependency, multi-page static site generator.
 *
 * Reads content.json and renders one HTML file per page into dist/.
 * No npm install required. Run with:  node build.js
 *
 * MODEL
 *   content.json holds shared config (brand, nav, footer) plus a `pages` map.
 *   Each page is { title, description, slug, blocks: [...] }.
 *   Each block is { type: "...", ...fields }. A renderer per type turns it
 *   into HTML. To add a new section, add a block type + a renderer here.
 *
 * The automation pipeline only ever writes content.json and drops images
 * into assets/ — never this file.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// --- helpers ---------------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stars(n) {
  const count = Math.max(0, Math.min(5, Number(n) || 5));
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function paras(body) {
  // Accept a string or an array of paragraphs.
  const arr = Array.isArray(body) ? body : [body];
  return arr.filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("\n        ");
}

function btn(label, url, cls) {
  if (!label) return "";
  return `<a class="btn ${cls || "btn-primary"}" href="${esc(url || "#")}">${esc(label)}</a>`;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function telHref(phone) {
  return "tel:" + String(phone || "").replace(/[^0-9+]/g, "");
}

// --- block renderers -------------------------------------------------------
// Each renderer receives (block, ctx) and returns an HTML string.
// ctx = { brand }.

const BLOCKS = {
  hero(b, ctx) {
    const style = b.image ? ` style="--hero-image:url('${esc(b.image)}')"` : "";
    return `<section class="hero"${style}>
    <div class="container hero-inner">
      ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
      <h1>${esc(b.headline)}</h1>
      ${b.subhead ? `<p class="hero-sub">${esc(b.subhead)}</p>` : ""}
      ${btn(b.cta, b.ctaUrl || ctx.brand.primaryCtaUrl, "btn-primary btn-lg")}
    </div>
  </section>`;
  },

  pageHeader(b) {
    const style = b.image ? ` style="--hero-image:url('${esc(b.image)}')"` : "";
    return `<section class="page-header${b.image ? " has-image" : ""}"${style}>
    <div class="container">
      ${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ""}
      <h1>${esc(b.headline)}</h1>
      ${b.subhead ? `<p class="lead">${esc(b.subhead)}</p>` : ""}
    </div>
  </section>`;
  },

  text(b, ctx) {
    const align = b.center === false ? "" : " center";
    const width = b.wide ? "" : " narrow";
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container${width}${align}">
      ${b.headline ? `<h2>${esc(b.headline)}</h2>` : ""}
      ${paras(b.body)}
      ${btn(b.cta, b.ctaUrl || ctx.brand.primaryCtaUrl, "btn-outline")}
    </div>
  </section>`;
  },

  empathy(b) {
    return `<section class="section empathy soft-bg">
    <div class="container narrow center">
      <h2>${esc(b.headline)}</h2>
      ${b.tagline ? `<p class="tagline"><em>${esc(b.tagline)}</em></p>` : ""}
    </div>
  </section>`;
  },

  steps(b) {
    const items = (b.steps || [])
      .map(
        (s, i) => `<div class="step">
          <div class="step-img" style="background-image:url('${esc(s.image || "")}')"><span class="step-num">${i + 1}</span></div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.body)}</p>
        </div>`
      )
      .join("\n        ");
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      <div class="grid grid-3">
        ${items}
      </div>
    </div>
  </section>`;
  },

  split(b, ctx) {
    const media = `<div class="split-media${b.tall ? " tall" : ""}" style="background-image:url('${esc(b.image || "")}')"></div>`;
    const text = `<div class="split-text">
        ${b.headline ? `<h2>${esc(b.headline)}</h2>` : ""}
        ${paras(b.body)}
        ${btn(b.cta, b.ctaUrl || ctx.brand.primaryCtaUrl, "btn-primary")}
      </div>`;
    const order = b.mediaSide === "right" ? text + "\n      " + media : media + "\n      " + text;
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container split">
      ${order}
    </div>
  </section>`;
  },

  cards(b) {
    const items = (b.items || [])
      .map(
        (it) => `<div class="card">
          ${it.icon ? `<div class="card-icon">${esc(it.icon)}</div>` : ""}
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.body)}</p>
          ${it.linkText ? `<a class="link-arrow" href="${esc(it.linkUrl || "#")}">${esc(it.linkText)} →</a>` : ""}
        </div>`
      )
      .join("\n        ");
    const cols = b.columns === 2 ? "grid-2" : "grid-3";
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      ${b.intro ? `<p class="lead center section-intro">${esc(b.intro)}</p>` : ""}
      <div class="grid ${cols}">
        ${items}
      </div>
    </div>
  </section>`;
  },

  checklist(b) {
    const items = (b.items || []).map((i) => `<li>${esc(i)}</li>`).join("\n          ");
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container split">
      <div class="split-text">
        ${b.headline ? `<h2>${esc(b.headline)}</h2>` : ""}
        ${paras(b.body)}
      </div>
      <div class="split-text">
        <ul class="check-list">
          ${items}
        </ul>
      </div>
    </div>
  </section>`;
  },

  ctaBand(b, ctx) {
    return `<section class="cta-band">
    <div class="container center">
      <h2>${esc(b.headline)}</h2>
      ${b.body ? `<p class="lead">${esc(b.body)}</p>` : ""}
      ${btn(b.cta, b.ctaUrl || ctx.brand.primaryCtaUrl, "btn-light btn-lg")}
    </div>
  </section>`;
  },

  testimonials(b) {
    const items = (b.items || [])
      .map(
        (it) => `<figure class="review">
          <div class="stars">${stars(it.rating)}</div>
          <blockquote>${esc(it.quote)}</blockquote>
          <figcaption>— ${esc(it.name)}</figcaption>
        </figure>`
      )
      .join("\n        ");
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      <div class="grid grid-3 reviews">
        ${items}
      </div>
    </div>
  </section>`;
  },

  locations(b, ctx) {
    const items = (b.items || [])
      .map(
        (l) => `<div class="location-card">
          <h3>${esc(l.name)}</h3>
          <p class="addr">${esc(l.address)}</p>
          ${(l.hours || []).length ? `<ul class="plain hours">${(l.hours || []).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
          ${l.phone ? `<p><a href="${telHref(l.phone)}">${esc(l.phone)}</a></p>` : ""}
          ${l.mapUrl ? `<a class="link-arrow" href="${esc(l.mapUrl)}" target="_blank" rel="noopener">Get directions →</a>` : ""}
        </div>`
      )
      .join("\n        ");
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      <div class="grid grid-3 locations">
        ${items}
      </div>
    </div>
  </section>`;
  },

  jobs(b) {
    const items = (b.items || []).length
      ? (b.items || [])
          .map(
            (j) => `<div class="job-card">
          <div class="job-head">
            <h3>${esc(j.title)}</h3>
            <span class="job-meta">${esc([j.type, j.location].filter(Boolean).join(" · "))}</span>
          </div>
          <p>${esc(j.body)}</p>
          ${btn(j.applyText || "Apply now", j.applyUrl, "btn-outline")}
        </div>`
          )
          .join("\n        ")
      : `<p class="lead center">${esc(b.emptyMessage || "No open roles right now — but we're always glad to meet great people. Reach out anytime.")}</p>`;
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      ${b.intro ? `<p class="lead center section-intro">${esc(b.intro)}</p>` : ""}
      <div class="job-list">
        ${items}
      </div>
    </div>
  </section>`;
  },

  // Raw HTML/script embed — used for HubSpot scheduler & form, maps, etc.
  // NOTE: html is injected verbatim (NOT escaped) because embeds need scripts.
  embed(b) {
    return `<section class="section${b.soft ? " soft-bg" : ""}" id="${esc(b.id || "embed")}">
    <div class="container${b.wide ? "" : " narrow"}">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      ${b.intro ? `<p class="lead center section-intro">${esc(b.intro)}</p>` : ""}
      <div class="embed-wrap">
        ${b.html || `<p class="embed-placeholder">[ Embed not configured — paste your HubSpot embed code into this block's <code>html</code> field in content.json ]</p>`}
      </div>
    </div>
  </section>`;
  },

  // Native Netlify form (works on Netlify with zero backend).
  form(b) {
    const fields = (b.fields || [])
      .map((f) => {
        const req = f.required ? " required" : "";
        const label = `<label for="f-${esc(f.name)}">${esc(f.label)}${f.required ? " *" : ""}</label>`;
        if (f.type === "textarea") {
          return `<div class="field full">${label}<textarea id="f-${esc(f.name)}" name="${esc(f.name)}" rows="5"${req}></textarea></div>`;
        }
        return `<div class="field${f.full ? " full" : ""}">${label}<input id="f-${esc(f.name)}" type="${esc(f.type || "text")}" name="${esc(f.name)}"${req} /></div>`;
      })
      .join("\n          ");
    const name = b.formName || "contact";
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container narrow">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      ${b.intro ? `<p class="lead center section-intro">${esc(b.intro)}</p>` : ""}
      <form class="contact-form" name="${esc(name)}" method="POST" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="${esc(name)}" />
        <p class="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>
        <div class="field-grid">
          ${fields}
        </div>
        <button class="btn btn-primary btn-lg" type="submit">${esc(b.submitText || "Send")}</button>
      </form>
    </div>
  </section>`;
  },

  faq(b) {
    const items = (b.items || [])
      .map(
        (f) => `<details class="faq-item">
          <summary>${esc(f.q)}</summary>
          <div class="faq-a">${paras(f.a)}</div>
        </details>`
      )
      .join("\n        ");
    return `<section class="section${b.soft ? " soft-bg" : ""}">
    <div class="container narrow">
      ${b.headline ? `<h2 class="center">${esc(b.headline)}</h2>` : ""}
      <div class="faq">
        ${items}
      </div>
    </div>
  </section>`;
  },

  leadMagnet(b, ctx) {
    return BLOCKS.split({ ...b, mediaSide: b.mediaSide || "right", tall: true, soft: b.soft }, ctx);
  },
};

// --- blog ------------------------------------------------------------------
// Posts live in content.json under `blog.posts`. The blog index page uses a
// { type: "blogIndex" } block; each post renders to its own flat HTML file.

function blogIndexBlock(content) {
  const posts = (content.blog && content.blog.posts) || [];
  const cards = posts.length
    ? posts
        .map(
          (p) => `<a class="post-card" href="${esc(postSlug(p))}.html">
          ${p.cover ? `<div class="post-cover" style="background-image:url('${esc(p.cover)}')"></div>` : ""}
          <div class="post-body">
            ${p.date ? `<span class="post-date">${esc(p.date)}</span>` : ""}
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt || "")}</p>
            <span class="link-arrow">Read more →</span>
          </div>
        </a>`
        )
        .join("\n        ")
    : `<p class="lead center">Articles are on the way — check back soon.</p>`;
  return `<section class="section">
    <div class="container">
      <div class="grid grid-3 post-grid">
        ${cards}
      </div>
    </div>
  </section>`;
}

function postSlug(p) {
  return (
    p.slug ||
    String(p.title || "post")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function renderPostPage(content, post) {
  const ctx = { brand: content.brand };
  const body = `<article class="post">
    ${BLOCKS.pageHeader({ eyebrow: post.date, headline: post.title, subhead: post.excerpt })}
    <section class="section">
      <div class="container narrow post-content">
        ${paras(post.body)}
        <p style="margin-top:2rem"><a class="link-arrow" href="blog.html">← Back to all articles</a></p>
      </div>
    </section>
  </article>`;
  return pageShell(content, { title: post.title + " — " + content.brand.name, description: post.excerpt || "" }, "blog", body, ctx);
}

// --- shared chrome ---------------------------------------------------------

function renderHead(content, page) {
  const k = content.brand.colors;
  const title = page.title || content.brand.name;
  const desc = page.description || (content.meta && content.meta.description) || "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="generator" content="pt-website-template" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  <style>
    :root {
      --primary: ${k.primary};
      --primary-dark: ${k.primaryDark};
      --ink: ${k.ink};
      --muted: ${k.muted};
      --bg: ${k.bg};
      --soft: ${k.soft};
      --line: ${k.line};
    }
  </style>
</head>`;
}

function renderHeader(content, currentSlug) {
  const nav = (content.nav || [])
    .map((n) => {
      const active = n.url === currentSlug || (currentSlug === "index" && (n.url === "index.html" || n.url === "/"));
      return `<a href="${esc(n.url)}"${active ? ' class="active" aria-current="page"' : ""}>${esc(n.label)}</a>`;
    })
    .join("\n        ");
  return `<header class="site-header">
    <div class="container header-inner">
      <a class="logo" href="index.html">${esc(content.brand.logoText || content.brand.name)}</a>
      <nav class="nav" id="nav">
        ${nav}
      </nav>
      <a class="btn btn-primary header-cta" href="${esc(content.brand.primaryCtaUrl)}">${esc(content.brand.headerCta || content.brand.primaryCta)}</a>
      <button class="nav-toggle" aria-label="Menu" onclick="document.getElementById('nav').classList.toggle('open')">☰</button>
    </div>
  </header>`;
}

function renderFooter(content) {
  const f = content.footer || {};
  const locs = (f.locations || []).map((l) => `<li>${esc(l)}</li>`).join("\n          ");
  const hours = (f.hours || []).map((h) => `<li>${esc(h)}</li>`).join("\n          ");
  const links = (f.links || [])
    .map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`)
    .join("\n          ");
  return `<footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <div class="footer-logo">${esc(content.brand.logoText || content.brand.name)}</div>
        <ul class="plain">
          <li><a href="mailto:${esc(content.brand.email)}">${esc(content.brand.email)}</a></li>
          <li><a href="${telHref(content.brand.phone)}">${esc(content.brand.phone)}</a></li>
        </ul>
      </div>
      <div>
        <h4>Locations</h4>
        <ul class="plain">
          ${locs}
        </ul>
      </div>
      <div>
        <h4>Hours</h4>
        <ul class="plain">
          ${hours}
        </ul>
      </div>
      <div>
        <h4>Explore</h4>
        <ul class="plain">
          ${links}
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© <span id="year"></span> ${esc(content.brand.name)}. All rights reserved.</p>
    </div>
    <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
  </footer>`;
}

function pageShell(content, page, currentSlug, mainHtml, ctx) {
  return [
    renderHead(content, page),
    "<body>",
    renderHeader(content, currentSlug),
    "<main>",
    mainHtml,
    "</main>",
    renderFooter(content),
    "</body>",
    "</html>",
  ].join("\n");
}

function renderPage(content, slug, page) {
  const ctx = { brand: content.brand };
  const blocks = (page.blocks || [])
    .map((b) => {
      if (b.type === "blogIndex") return blogIndexBlock(content);
      const fn = BLOCKS[b.type];
      if (!fn) {
        console.warn(`  ! unknown block type "${b.type}" on page "${slug}" — skipped`);
        return "";
      }
      return fn(b, ctx);
    })
    .join("\n");
  return pageShell(content, page, slug, blocks, ctx);
}

// --- main ------------------------------------------------------------------

function main() {
  const content = JSON.parse(read("content.json"));

  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let count = 0;

  // Pages
  const pages = content.pages || {};
  for (const slug of Object.keys(pages)) {
    const html = renderPage(content, slug, pages[slug]);
    fs.writeFileSync(path.join(DIST, `${slug}.html`), html);
    count++;
  }

  // Blog posts
  const posts = (content.blog && content.blog.posts) || [];
  for (const post of posts) {
    fs.writeFileSync(path.join(DIST, `${postSlug(post)}.html`), renderPostPage(content, post));
    count++;
  }

  // CSS
  fs.copyFileSync(path.join(ROOT, "styles.css"), path.join(DIST, "styles.css"));

  // Assets
  const assetsSrc = path.join(ROOT, "assets");
  if (fs.existsSync(assetsSrc)) {
    const assetsDest = path.join(DIST, "assets");
    fs.mkdirSync(assetsDest, { recursive: true });
    for (const file of fs.readdirSync(assetsSrc)) {
      const src = path.join(assetsSrc, file);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(assetsDest, file));
    }
  }

  console.log(`✓ Built ${count} pages into dist/`);
}

main();
