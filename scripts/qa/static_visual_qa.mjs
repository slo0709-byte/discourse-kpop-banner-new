#!/usr/bin/env node

import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const partials = [
  "_tokens.scss",
  "_layout.scss",
  "_controls.scss",
  "_modal.scss",
  "_responsive.scss",
  "_animations.scss",
];

function parseArgs(argv) {
  const options = { viewport: "1440x900", evidence: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--viewport") {
      options.viewport = argv[++index];
    } else if (arg === "--evidence") {
      options.evidence = argv[++index];
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.evidence) {
    throw new Error("--evidence is required");
  }
  return options;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(value || "");
  if (!match) {
    throw new Error(`Invalid viewport "${value}"`);
  }
  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  };
}

async function readStyles() {
  const sources = await Promise.all(
    partials.map((file) =>
      readFile(`assets/stylesheets/common/kpop-banner/${file}`, "utf8"),
    ),
  );
  return sources.join("\n");
}

function buildHtml(css) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
:root {
  --primary: #202124;
  --primary-high: #3f434a;
  --primary-medium: #6b7280;
  --primary-low-mid: #c8ced8;
  --primary-low: #e5e7eb;
  --primary-very-low: #f5f6f8;
  --secondary: #ffffff;
  --secondary-very-low: #f8fafc;
  --tertiary: #2563eb;
  --tertiary-low: #dbeafe;
  --danger: #dc2626;
  --danger-low: #fee2e2;
  --highlight: #ca8a04;
  --highlight-low: #fef3c7;
  --success: #16a34a;
}
body { margin: 0; padding: 16px; background: var(--secondary); }
.above-main-container { max-width: 1080px; margin: 0 auto; }
${css}
</style>
</head>
<body>
<div class="above-main-container">
<div data-kpop-banner>
<div class="kpop-controls-row">
  <select class="kpop-select"><option>iChart 실시간 차트 긴 이름</option></select>
  <select class="kpop-select"><option>일간 / 주간 / 월간</option></select>
</div>
<section class="kpop-celebration">
  <button class="kpop-celebration__close-banner">x</button>
  <div class="kpop-celebration__card">
    <div class="kpop-celebration__glow"></div>
    <div class="kpop-celebration__main-row">
      <div class="kpop-celebration__hero-main">
        <div class="kpop-celebration__left">
          <a class="kpop-celebration__cover-link" href="#">
            <span class="kpop-celebration__cover-frame">
              <img class="kpop-celebration__cover is-visible" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%232563eb'/%3E%3C/svg%3E">
            </span>
            <span class="kpop-celebration__cover-play">play</span>
          </a>
          <span class="kpop-celebration__rank-badge">1</span>
        </div>
        <div class="kpop-celebration__center">
          <div class="kpop-celebration__title-row">
            <div class="kpop-celebration__title">Very Long K-pop Song Title That Must Ellipsize Correctly</div>
            <div class="kpop-celebration__status-wrap"><span class="kpop-celebration__badge kpop-celebration__badge--pak">PAK</span></div>
          </div>
          <div class="kpop-celebration__artist-row"><div class="kpop-celebration__artist">Very Long Artist Name With Multiple Members</div></div>
          <div class="kpop-celebration__extra-info">
            <div class="kpop-celebration__platform-marquee"><div class="kpop-celebration__platform-track">
              <span class="kpop-celebration__pill is-melon"><span class="kpop-celebration__pill-name">Melon</span><span class="kpop-celebration__pill-rank">#1</span></span>
              <span class="kpop-celebration__pill is-youtube"><span class="kpop-celebration__pill-name">YouTube</span><span class="kpop-celebration__pill-rank">#2</span></span>
            </div></div>
          </div>
        </div>
        <div class="kpop-celebration__right">
          <div class="kpop-celebration__stats"><div class="kpop-celebration__points">99,999</div><div class="kpop-celebration__points-label">POINTS</div></div>
          <div class="kpop-celebration__actions">
            <button class="kpop-celebration__details-btn"><span class="kpop-celebration__details-text">Details</span></button>
            <button class="kpop-celebration__icon-btn">↗</button>
            <button class="kpop-celebration__icon-btn kpop-celebration__like-btn"><span class="kpop-celebration__like-icon">♡</span></button>
          </div>
        </div>
      </div>
      <aside class="kpop-celebration__mini-sidebar">
        <button class="kpop-celebration__mini-item is-active"><span class="kpop-celebration__mini-left"><span class="kpop-celebration__mini-rank is-top">1</span><span class="kpop-celebration__mini-title">Long Sidebar Title One</span></span><span class="kpop-celebration__mini-trend is-up">up</span></button>
        <button class="kpop-celebration__mini-item"><span class="kpop-celebration__mini-left"><span class="kpop-celebration__mini-rank">2</span><span class="kpop-celebration__mini-title">Long Sidebar Title Two</span></span><span class="kpop-celebration__mini-trend is-same">-</span></button>
        <button class="kpop-celebration__show-more">Load more</button>
      </aside>
    </div>
  </div>
</section>
</div>
</div>
</body>
</html>`;
}

async function assertLayout(page) {
  const result = await page.evaluate(() => {
    const selectors = [
      ".kpop-controls-row",
      ".kpop-select",
      ".kpop-celebration__main-row",
      ".kpop-celebration__hero-main",
      ".kpop-celebration__title",
      ".kpop-celebration__details-btn",
    ];
    const failures = [];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        if (rect.left < -1 || rect.right > window.innerWidth + 1) {
          failures.push(`${selector} overflows viewport`);
        }
        if (element.scrollWidth > element.clientWidth + 2 && selector.includes("btn")) {
          failures.push(`${selector} text overflows button`);
        }
      }
    }
    if (document.documentElement.scrollWidth > window.innerWidth + 2) {
      failures.push("document has horizontal overflow");
    }
    return failures;
  });
  if (result.length) {
    throw new Error(result.join("; "));
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const viewport = parseViewport(options.viewport);
  const evidencePath = resolve(options.evidence);
  await mkdir(dirname(evidencePath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport });
    await page.setContent(buildHtml(await readStyles()), { waitUntil: "load" });
    await assertLayout(page);
    await page.screenshot({ path: evidencePath, fullPage: true });
    console.log(`PASS static-visual ${options.viewport} ${pathToFileURL(evidencePath).href}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
