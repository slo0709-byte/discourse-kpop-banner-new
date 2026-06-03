import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const moduleRoots = [
  "assets/javascripts/discourse/initializers/kpop-banner.js",
  ...readdirSync("assets/javascripts/discourse/lib")
    .filter((file) => file.startsWith("kpop-banner") && file.endsWith(".js"))
    .map((file) => join("assets/javascripts/discourse/lib", file)),
].sort();

function pureLoc(file) {
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("/*") &&
        !trimmed.startsWith("*") &&
        !trimmed.startsWith("*/")
      );
    }).length;
}

describe("kpop banner module sizes", () => {
  it("keeps the initializer facade and lifecycle modules under 250 pure LOC", () => {
    const oversized = moduleRoots
      .map((file) => ({ file, pureLoc: pureLoc(file) }))
      .filter(({ pureLoc: count }) => count > 250);

    assert.deepEqual(oversized, []);
  });
});
