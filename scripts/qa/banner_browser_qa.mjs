#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SCENARIOS = new Set([
  "xss",
  "modal-normal",
  "single-root",
  "cache-refresh",
  "desktop",
  "mobile",
]);

const DEFAULT_VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

class CliError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliError";
  }
}

function printHelp() {
  console.log(`Usage: node scripts/qa/banner_browser_qa.mjs [options]

Options:
  --help                     Show this help.
  --scenario <name>          One of: ${[...SCENARIOS].join(", ")}
  --base-url <url>           Page URL to test.
  --evidence <path>          Screenshot path to write.
  --viewport <width>x<height> Override viewport, for example 1280x720.

Scenarios:
  xss
  modal-normal
  single-root
  cache-refresh
  desktop
  mobile`);
}

function parseArgs(argv) {
  const options = {
    help: false,
    scenario: null,
    baseUrl: null,
    evidence: null,
    viewport: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help") {
      options.help = true;
    } else if (arg === "--scenario") {
      options.scenario = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--base-url") {
      options.baseUrl = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--evidence") {
      options.evidence = readValue(argv, index, arg);
      index += 1;
    } else if (arg === "--viewport") {
      options.viewport = parseViewport(readValue(argv, index, arg));
      index += 1;
    } else {
      throw new CliError(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function readValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliError(`Missing value for ${optionName}`);
  }
  return value;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) {
    throw new CliError(`Invalid viewport "${value}". Expected WIDTHxHEIGHT.`);
  }

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (width < 1 || height < 1) {
    throw new CliError("Viewport dimensions must be positive integers.");
  }
  return { width, height };
}

function assertRunOptions(options) {
  if (!options.scenario) {
    throw new CliError("--scenario is required unless --help is used.");
  }
  if (!SCENARIOS.has(options.scenario)) {
    throw new CliError(`Unsupported scenario "${options.scenario}".`);
  }
  if (!options.baseUrl) {
    throw new CliError("--base-url is required for scenario runs.");
  }
  if (!options.evidence) {
    throw new CliError("--evidence is required for scenario runs.");
  }
}

async function loadChromium() {
  try {
    const playwright = await import("playwright");
    return playwright.chromium;
  } catch (error) {
    throw new CliError(
      `Playwright is required for scenario runs. Install it first. ${error.message}`,
    );
  }
}

function viewportFor(options) {
  if (options.viewport) {
    return options.viewport;
  }
  if (options.scenario === "mobile") {
    return DEFAULT_VIEWPORTS.mobile;
  }
  return DEFAULT_VIEWPORTS.desktop;
}

async function runScenario(options) {
  assertRunOptions(options);
  const chromium = await loadChromium();
  const viewport = viewportFor(options);
  const evidencePath = resolve(options.evidence);
  let browser = null;
  let context = null;

  try {
    browser = await chromium.launch();
    context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const observed = observePage(page);
    await page.goto(options.baseUrl, { waitUntil: "networkidle" });
    await executeScenario(page, options.scenario, observed);
    await mkdir(dirname(evidencePath), { recursive: true });
    await page.screenshot({ path: evidencePath, fullPage: true });
    console.log(`PASS ${options.scenario} ${pathToFileURL(evidencePath).href}`);
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

function observePage(page) {
  const observed = {
    dialogSeen: false,
    consoleErrors: [],
    dataMtimes: [],
  };
  page.on("dialog", async (dialog) => {
    observed.dialogSeen = true;
    await dialog.dismiss();
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      observed.consoleErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    const dataMtime = response.headers()["x-kpop-data-mtime"];
    if (dataMtime) {
      observed.dataMtimes.push({ method: response.request().method(), url: response.url(), dataMtime });
    }
  });
  return observed;
}

async function executeScenario(page, scenario, observed) {
  if (scenario === "xss") {
    await assertNoDialog(page, observed);
    await assertNoXssFlag(page);
  } else if (scenario === "modal-normal") {
    await assertNoConsoleErrors(page, observed);
    await assertModalOpens(page);
  } else if (scenario === "single-root") {
    await assertSingleRoot(page);
  } else if (scenario === "cache-refresh") {
    const observedDataCount = observed.dataMtimes.length;
    await page.reload({ waitUntil: "networkidle" });
    await assertDataMtimeObserved(observed, observedDataCount);
  } else {
    await page.waitForLoadState("domcontentloaded");
  }
}

async function assertNoDialog(page, observed) {
  await page.waitForTimeout(250);
  if (observed.dialogSeen) {
    throw new CliError("Unexpected browser dialog detected.");
  }
}

async function assertNoConsoleErrors(page, observed) {
  await page.waitForTimeout(250);
  if (observed.consoleErrors.length > 0) {
    throw new CliError(`Console errors detected: ${observed.consoleErrors.join(" | ")}`);
  }
}

async function assertNoXssFlag(page) {
  const xssFlag = await page.evaluate(() => Boolean(window.__kpopXss));
  if (xssFlag) {
    throw new CliError("Unexpected window.__kpopXss flag detected.");
  }
}

async function assertModalOpens(page) {
  const openModalBtn = page.locator("#open-modal-btn");
  const modal = page.locator("#details-modal");
  const modalContent = page.locator("#details-modal .kpop-modal-content");
  const modalTitle = page.locator("#modal-title");

  await openModalBtn.click();
  await modal.waitFor({ state: "visible" });
  await modalContent.waitFor({ state: "visible" });

  const titleText = (await modalTitle.textContent())?.trim();
  const ariaHidden = await modal.getAttribute("aria-hidden");
  if (!titleText) {
    throw new CliError("Modal title is empty after opening the modal.");
  }
  if (ariaHidden !== "false") {
    throw new CliError(`Expected modal aria-hidden=\"false\", found ${ariaHidden ?? "null"}.`);
  }
}

async function assertSingleRoot(page) {
  const root = page.locator("[data-kpop-banner]");
  await root.first().waitFor({ state: "attached" });
  const rootCount = await root.count();
  if (rootCount !== 1) {
    throw new CliError(`Expected exactly one [data-kpop-banner] root, found ${rootCount}.`);
  }
}

async function assertDataMtimeObserved(observed, observedDataCount) {
  const reloadMtimes = observed.dataMtimes.slice(observedDataCount);
  if (reloadMtimes.length === 0) {
    throw new CliError("Expected a data response with X-Kpop-Data-Mtime during cache-refresh.");
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  await runScenario(options);
}

main().catch((error) => {
  const prefix = error instanceof CliError ? "ERROR" : "UNEXPECTED";
  console.error(`${prefix}: ${error.message}`);
  process.exitCode = 1;
});
