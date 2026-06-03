import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const entryFile = "assets/stylesheets/common/kpop-banner.scss";
const partialDir = "assets/stylesheets/common/kpop-banner";
const expectedPartials = [
  "_tokens.scss",
  "_layout.scss",
  "_controls.scss",
  "_modal.scss",
  "_responsive.scss",
];

function pureLoc(source) {
  return source
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*");
    }).length;
}

describe("kpop banner SCSS structure", () => {
  it("keeps the common entry as imports only and splits partials below 250 LOC", () => {
    const entry = readFileSync(entryFile, "utf8");
    const entryLines = entry.split(/\r?\n/).filter((line) => line.trim());

    assert.ok(existsSync(partialDir), "expected kpop-banner partial directory");
    assert.deepEqual(
      expectedPartials.every((file) => existsSync(join(partialDir, file))),
      true,
    );
    assert.deepEqual(
      entryLines.every((line) => /^@(import|use)\s+/.test(line.trim())),
      true,
      "common kpop-banner.scss should only import partials",
    );

    const oversized = readdirSync(partialDir)
      .filter((file) => file.endsWith(".scss"))
      .map((file) => {
        const fullPath = join(partialDir, file);
        return { file: fullPath, pureLoc: pureLoc(readFileSync(fullPath, "utf8")) };
      })
      .filter(({ pureLoc: count }) => count > 250);

    assert.deepEqual(oversized, []);
  });

  it("keeps mobile controls from overflowing narrow viewports", () => {
    const responsive = readFileSync(join(partialDir, "_responsive.scss"), "utf8");

    assert.match(responsive, /@media\s*\(max-width:\s*900px\)/);
    assert.match(
      responsive,
      /\.kpop-controls-row\s*\{[^}]*flex-wrap:\s*wrap/s,
    );
    assert.match(
      responsive,
      /\.kpop-select\s*\{[^}]*max-width:\s*100%/s,
    );
  });
});
