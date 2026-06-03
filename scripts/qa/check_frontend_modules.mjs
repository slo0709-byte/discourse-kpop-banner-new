import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const maxPureLoc = 250;
const root = new URL("../..", import.meta.url).pathname;
const files = [
  "assets/javascripts/discourse/initializers/kpop-banner.js",
  ...readdirSync(join(root, "assets/javascripts/discourse/lib"))
    .filter((file) => file.startsWith("kpop-banner-105-") && file.endsWith(".js"))
    .map((file) => `assets/javascripts/discourse/lib/${file}`),
];

const rows = files.map((file) => {
  const source = readFileSync(join(root, file), "utf8");
  const pureLoc = source
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("//"))
    .length;
  return { file, pureLoc };
});

const failing = rows.filter((row) => row.pureLoc > maxPureLoc);
const report = rows
  .map((row) => `${row.pureLoc.toString().padStart(4, " ")} ${row.file}`)
  .join("\n");

writeFileSync(join(root, "evidence/task-5-module-loc.txt"), `${report}\n`);

if (failing.length) {
  console.error(report);
  console.error(`FAIL: ${failing.length} frontend module(s) exceed ${maxPureLoc} pure LOC`);
  process.exit(1);
}

console.log(report);
console.log(`PASS: all frontend modules are <= ${maxPureLoc} pure LOC`);
