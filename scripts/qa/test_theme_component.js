#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SELECTORS = {
  root: process.env.KPOP_BANNER_ROOT_SELECTOR || "#kpop-banner-root, .kpop-banner-root, [data-kpop-banner-root]",
  tabs: process.env.KPOP_BANNER_TAB_SELECTOR || '[role="tab"], .kpop-banner-tab, .kpop-tab',
  list: process.env.KPOP_BANNER_LIST_SELECTOR || ".kpop-banner-list, .kpop-chart-list, [data-kpop-banner-list]",
};

async function loadChromium() {
  const playwright = await import("playwright");
  return playwright.chromium;
}

function baseUrl() {
  try {
    return new URL(process.env.BASE_URL || "http://localhost:4200").toString();
  } catch {
    throw new Error(`Invalid BASE_URL: ${process.env.BASE_URL}`);
  }
}

async function main() {
  const chromium = await loadChromium();
  const evidencePath = resolve(process.env.EVIDENCE_PATH || "evidence/theme-component-smoke.json");
  const summary = {
    baseUrl: baseUrl(),
    selectors: SELECTORS,
    rootCount: 0,
    tabCount: 0,
    listCount: 0,
    responses: [],
    consoleErrors: [],
  };
  let browser = null;

  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("response", (response) => {
      if (summary.responses.length < 20) {
        summary.responses.push({ url: response.url(), status: response.status() });
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        summary.consoleErrors.push(message.text());
      }
    });

    await page.goto(summary.baseUrl, { waitUntil: "networkidle" });
    summary.rootCount = await page.locator(SELECTORS.root).count();
    summary.tabCount = await page.locator(SELECTORS.tabs).count();
    summary.listCount = await page.locator(SELECTORS.list).count();

    if (summary.rootCount < 1) {
      throw new Error(`Missing banner root selector: ${SELECTORS.root}`);
    }
    if (summary.tabCount < 1) {
      throw new Error(`Missing banner tab selector: ${SELECTORS.tabs}`);
    }
    if (summary.listCount < 1) {
      throw new Error(`Missing banner list selector: ${SELECTORS.list}`);
    }
    if (summary.consoleErrors.length > 0) {
      throw new Error(`Console errors: ${summary.consoleErrors.join(" | ")}`);
    }
  } finally {
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${JSON.stringify(summary, null, 2)}\n`);
    if (browser) {
      await browser.close();
    }
  }

  console.log(evidencePath);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
