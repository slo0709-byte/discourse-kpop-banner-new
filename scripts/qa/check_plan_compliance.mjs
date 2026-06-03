import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const planPath =
  process.env.KPOP_PLAN_PATH ||
  "/root/kchat/plans/discourse-kpop-banner-optimization.md";
const ledgerPath =
  process.env.KPOP_LEDGER_PATH || "/root/kchat/.omo/start-work/ledger.jsonl";

const tasks = [
  "1. 建立插件测试与 CI 基线",
  "2. 锁定服务器数据代理契约",
  "3. 加固访问控制与公开数据范围",
  "4. 建立安全渲染边界",
  "5. 拆分前端状态与数据加载大文件",
  "6. 整理 SCSS 与响应式 UI",
  "7. 收敛迁移、文档与发布方案",
];

const plan = fs.readFileSync(planPath, "utf8");
const checkboxLines = plan
  .split("\n")
  .filter((line) => /^- \[[ x]\]/.test(line));

if (checkboxLines.length !== 11) {
  throw new Error(`Expected 11 top-level checkboxes, found ${checkboxLines.length}`);
}

for (const task of tasks) {
  if (!plan.includes(`- [x] ${task}`)) {
    throw new Error(`Plan task is not checked: ${task}`);
  }
}

const firstUnchecked = checkboxLines.find((line) => line.startsWith("- [ ]"));
if (!firstUnchecked?.startsWith("- [ ] F1. Plan Compliance Audit")) {
  throw new Error(`F1 is not the first unchecked checkbox: ${firstUnchecked}`);
}

const entries = fs
  .readFileSync(ledgerPath, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid ledger JSON on line ${index + 1}: ${error.message}`);
    }
  });

for (const task of tasks) {
  const entry = entries
    .filter((item) => item.event === "task-completed" && item.task === task)
    .at(-1);

  if (!entry) {
    throw new Error(`Missing task-completed ledger entry: ${task}`);
  }

  for (const field of ["red_green", "artifact", "adversarial_classes", "cleanup"]) {
    if (entry[field] === undefined || entry[field] === null) {
      throw new Error(`Ledger entry ${task} missing ${field}`);
    }
  }

  if (!Array.isArray(entry.artifact) || entry.artifact.length === 0) {
    throw new Error(`Ledger entry ${task} has no artifacts`);
  }

  const missingArtifacts = entry.artifact.filter((artifactPath) => {
    const resolved = path.isAbsolute(artifactPath)
      ? artifactPath
      : path.join(root, artifactPath);
    return !fs.existsSync(resolved);
  });

  if (missingArtifacts.length > 0) {
    throw new Error(`Missing artifacts for ${task}: ${missingArtifacts.join(", ")}`);
  }

  const classes = Object.keys(entry.adversarial_classes || {});
  if (classes.length < 9) {
    throw new Error(`Ledger entry ${task} has only ${classes.length} adversarial classes`);
  }

  console.log(`PASS ${task}`);
}

console.log(`PASS top-level checkboxes=${checkboxLines.length}`);
console.log(`PASS first-unchecked=${firstUnchecked}`);
console.log("PASS plan compliance audit");
