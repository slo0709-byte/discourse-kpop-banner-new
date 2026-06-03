#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

function parseBaseUrl(value) {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Invalid BASE_URL: ${value}`);
  }
}

async function loadChromium() {
  const playwright = await import("playwright");
  return playwright.chromium;
}

async function main() {
  const baseUrl = parseBaseUrl(process.env.BASE_URL || "http://localhost:4200");
  const outputDir = resolve(process.env.EVIDENCE_DIR || "evidence/visual");
  const chromium = await loadChromium();
  let browser = null;

  try {
    browser = await chromium.launch();
    await mkdir(outputDir, { recursive: true });

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      const screenshotPath = join(outputDir, `${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await page.close();
      console.log(`${viewport.name} ${screenshotPath}`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
