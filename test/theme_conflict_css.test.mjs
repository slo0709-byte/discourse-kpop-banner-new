import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const css = fs.readFileSync("assets/stylesheets/common/kpop-banner/_theme-conflict.scss", "utf8");

test("overrides remote theme rules that hide kpop-celebration classes", () => {
  assert.match(css, /\[data-kpop-banner\]\s*\{/);
  assert.match(css, /display:\s*block\s*!important/);
  assert.match(css, /\[data-kpop-banner\]\s+\.kpop-celebration__main-row/);
  assert.match(css, /display:\s*flex\s*!important/);
});
