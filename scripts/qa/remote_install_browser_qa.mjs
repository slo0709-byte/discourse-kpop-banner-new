import fs from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://23.165.248.117";
const adminUser = process.env.KPOP_REMOTE_ADMIN_USER;
const adminPass = process.env.KPOP_REMOTE_ADMIN_PASS;
const evidenceDir = process.env.KPOP_REMOTE_EVIDENCE || "evidence/remote-install";

fs.mkdirSync(evidenceDir, { recursive: true });
const log = [];

function record(message) {
  log.push(`${new Date().toISOString()} ${message}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/root/.local/bin/google-chrome",
  headless: true,
});

try {
  const guest = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const guestPage = await guest.newPage();
  await guestPage.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await guestPage.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
  await guestPage.waitForSelector("[data-kpop-banner]", { state: "attached", timeout: 30000 });
  await guestPage.waitForTimeout(1500);
  const guestBannerCount = await guestPage.locator("[data-kpop-banner]").count();
  const guestVisibleCount = await guestPage.locator("[data-kpop-banner]:visible").count();
  const guestBannerBox = await guestPage.locator("[data-kpop-banner]").first().boundingBox();
  const guestBodyText = await guestPage.locator("body").innerText({ timeout: 10000 });
  await guestPage.screenshot({
    path: `${evidenceDir}/browser-guest-home.png`,
    fullPage: true,
  });
  record(`guest_home_status=${guestPage.url().startsWith(baseUrl) ? "loaded" : "unexpected-url"}`);
  record(`guest_banner_count=${guestBannerCount}`);
  record(`guest_banner_visible_count=${guestVisibleCount}`);
  record(`guest_banner_box=${JSON.stringify(guestBannerBox)}`);
  record(`guest_has_kpop_text=${/k-pop|kpop|music|chart|soridata/i.test(guestBodyText)}`);
  if (guestBannerCount !== 1) {
    throw new Error(`expected one guest banner root, got ${guestBannerCount}`);
  }
  await guest.close();

  if (adminUser && adminPass) {
    const admin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await admin.newPage();
    await adminPage.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await adminPage.locator("#login-account-name").fill(adminUser);
    await adminPage.locator("#login-account-password").fill(adminPass);
    await adminPage.locator("#login-button").click();
    await adminPage.waitForLoadState("load", { timeout: 60000 }).catch(() => {});
    await adminPage.goto(`${baseUrl}/admin/plugins/discourse-kpop-banner/settings`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await adminPage.waitForTimeout(3000);
    const adminText = await adminPage.locator("body").innerText({ timeout: 10000 });
    await adminPage.screenshot({
      path: `${evidenceDir}/browser-admin-settings.png`,
      fullPage: true,
    });
    const hasSettings = /kpop_banner|discourse-kpop-banner|K-pop|banner/i.test(adminText);
    record(`admin_settings_has_kpop=${hasSettings}`);
    if (!hasSettings) {
      throw new Error("admin settings page did not expose K-pop banner settings text");
    }
    await admin.close();
  } else {
    record("admin_settings_skipped=no_credentials");
  }

  record("QA_EXIT:0");
  fs.writeFileSync(`${evidenceDir}/browser-qa-log.txt`, `${log.join("\n")}\n`);
} catch (error) {
  record(`QA_ERROR:${error.message}`);
  fs.writeFileSync(`${evidenceDir}/browser-qa-log.txt`, `${log.join("\n")}\n`);
  throw error;
} finally {
  await browser.close();
}
