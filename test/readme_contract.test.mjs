import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const readme = readFileSync("README.md", "utf8");

describe("README rollout contract", () => {
  it("documents installation, data mount, migration, rollback, tests, and public scope", () => {
    const requiredPatterns = [
      /## Install/,
      /kpop_banner_data_dir/,
      /## Data Directory Mount/,
      /## Public Data Scope/,
      /public_limited/,
      /## Migration From Old Theme Component/,
      /disable the old theme component/i,
      /enable `kpop_banner_ui_enabled`/i,
      /## Rollback/,
      /## Test Commands/,
      /npm test/,
      /ruby test\/data_window_test\.rb/,
      /bin\/rspec plugins\/discourse-kpop-banner\/spec/,
      /scripts\/qa\/readme_rollout_qa\.sh install/,
      /scripts\/qa\/readme_rollout_qa\.sh rollback/,
      /## Common Errors/,
      /kpop_banner_ui_enabled` default is `false`/,
    ];

    const missing = requiredPatterns
      .filter((pattern) => !pattern.test(readme))
      .map((pattern) => pattern.toString());

    assert.deepEqual(missing, []);
  });
});
