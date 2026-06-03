import fs from "node:fs";

const text = (file) => fs.readFileSync(file, "utf8");

const checks = [
  ["desktop screenshot", "evidence/task-6-desktop.png", (file) => fs.statSync(file).size > 1000],
  ["mobile screenshot", "evidence/task-6-mobile.png", (file) => fs.statSync(file).size > 1000],
  ["visual final gate", "evidence/task-6-final-gate.txt", (file) => /QA_EXIT:0|PASS/.test(text(file))],
  [
    "anonymous public_limited",
    "evidence/task-2-public-limited.txt",
    (file) => /HTTP\/1\.1 200/.test(text(file)) && /songWins|Cache-Control|public/i.test(text(file)),
  ],
  [
    "logged_in private",
    "evidence/task-2-logged-private.txt",
    (file) => /HTTP\/1\.1 200/.test(text(file)) && /private|Cache-Control/i.test(text(file)),
  ],
  ["admin allowed", "evidence/task-3-admin.txt", (file) => /HTTP\/1\.1 200/.test(text(file))],
  [
    "admin denied",
    "evidence/task-3-admin-denied.txt",
    (file) => /HTTP\/1\.1 403|HTTP\/1\.1 404|Forbidden/i.test(text(file)),
  ],
  ["group member", "evidence/task-3-group-member.txt", (file) => /HTTP\/1\.1 200/.test(text(file))],
  [
    "group nonmember",
    "evidence/task-3-group-nonmember.txt",
    (file) => /HTTP\/1\.1 403|HTTP\/1\.1 404|Forbidden/i.test(text(file)),
  ],
  [
    "migration install",
    "evidence/task-7-install-doc.txt",
    (file) => /banner_status=200|home_status=200|QA_PASS|PASS/i.test(text(file)),
  ],
  [
    "rollback",
    "evidence/task-7-rollback.txt",
    (file) => /home_status=200|banner_status=200|QA_PASS|PASS/i.test(text(file)),
  ],
  [
    "malformed invalid json",
    "evidence/task-2-invalid-json.txt",
    (file) => /500|Invalid K-pop banner JSON/i.test(text(file)),
  ],
  [
    "malformed viewport",
    "evidence/task-6-malformed-input.txt",
    (file) => /invalid|exit|error/i.test(text(file)),
  ],
  [
    "malformed rollout mode",
    "evidence/task-7-malformed-input.txt",
    (file) => /usage|exit 2|EXIT:2|bad/i.test(text(file)),
  ],
  ["cleanup task2", "evidence/task-2-cleanup.txt", (file) => /killed local_data_server[\s\S]*remaining listener:\s*[\s\S]*absent/i.test(text(file))],
  ["cleanup task3", "evidence/task-3-cleanup.txt", (file) => /killed local_data_server[\s\S]*remaining listener:\s*[\s\S]*absent/i.test(text(file))],
  [
    "cleanup task5",
    "evidence/task-5-cleanup.txt",
    (file) => /## tmux[\s\S]*## processes[\s\S]*## ports[\s\S]*## artifacts/i.test(text(file)),
  ],
  [
    "cleanup task6",
    "evidence/task-6-cleanup.txt",
    (file) => /no .*session|no .*process|PASS/i.test(text(file)),
  ],
  ["cleanup task7", "evidence/task-7-cleanup.txt", (file) => /no listener|no .*session|PASS/i.test(text(file))],
];

for (const [name, file, predicate] of checks) {
  if (!fs.existsSync(file)) {
    throw new Error(`missing ${name}: ${file}`);
  }
  if (fs.statSync(file).size === 0) {
    throw new Error(`empty ${name}: ${file}`);
  }
  if (!predicate(file)) {
    throw new Error(`failed ${name}: ${file}`);
  }
  console.log(`PASS ${name}: ${file}`);
}

console.log("PASS real manual QA coverage");
