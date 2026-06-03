# Discourse K-pop Banner Plugin

Unified Discourse plugin for the K-pop banner UI and private K-pop chart data proxy.

## Responsibilities

- Render the K-pop banner in the `above-main-container` outlet.
- Serve chart JSON through `/kpop/banner-data`, the single UI data endpoint.
- Keep raw JSON files under `kpop_banner_data_dir` private.
- Control data access with plugin site settings.
- Cache parsed JSON by file modified time.

## Install

Copy this folder into the Discourse plugins directory and rebuild:

```bash
cp -a discourse-kpop-banner /var/discourse/shared/standalone/plugins/discourse-kpop-banner
cd /var/discourse
./launcher rebuild app
```

For development, link the plugin into a Discourse checkout:

```bash
export DISCOURSE_ROOT=/tmp/discourse-dev
ln -sfn "$PWD" "$DISCOURSE_ROOT/plugins/discourse-kpop-banner"
cd "$DISCOURSE_ROOT"
RAILS_ENV=test LOAD_PLUGINS=1 bin/rails db:migrate
```

## Data Directory Mount

Set `kpop_banner_data_dir` to the directory that contains generated chart JSON. The default is:

```text
/var/www/kpop-data/dist
```

For Docker installs, mount the host data directory into the app container at that path or update `kpop_banner_data_dir` to the mounted path. Do not place raw JSON under public uploads or theme assets.

## Data Endpoints

```text
/kpop/banner-data?source=unified
/kpop/banner-data?source=ichart
/kpop/banner-data?source=circle
/kpop/banner-data?source=kpopping
/kpop/banner-data?source=soridata&chart=song&limit=20
/kpop/banner-data?source=soridata&chart=artist&limit=20
```

Legacy compatibility endpoint:

```text
/kpop/soridata-musicshow-wins
```

The plugin UI does not fall back to raw JSON files. Guests can see the banner without being able to download complete private source files.

## Access Modes

- `public_limited`: visitors can read limited public slices; logged-in users can read full non-Soridata payloads and paged Soridata rankings.
- `logged_in`: logged-in users only.
- `group`: only members of `kpop_banner_allowed_groups`.
- `admin`: admins only.

## Public Data Scope

In `public_limited` mode, anonymous visitors never receive raw full Soridata files.

- `soridata`: returns `songWins` or `artistWins` only when requested with `chart=song` or `chart=artist`; anonymous requests default to 20 rows and are capped at 50 rows.
- `soridata` without `chart`: returns both `songWins` and `artistWins` as anonymous slices, each with pagination metadata.
- `unified`, `ichart`, `circle`, and `kpopping`: anonymous requests are recursively capped to the anonymous row limit so the banner can render without exposing complete source files.
- Logged-in users in `public_limited` mode can request complete non-Soridata payloads. Soridata remains paged so large rankings use load more instead of one large response.
- Staff can request full Soridata with `raw=1`.

## Migration From Old Theme Component

`kpop_banner_ui_enabled` default is `false`. Keep it disabled until the data proxy is confirmed and the old theme component is off.

1. Install the plugin and rebuild Discourse.
2. Mount or configure `kpop_banner_data_dir`.
3. Verify the data proxy:

   ```bash
   curl -i "$BASE_URL/kpop/banner-data?source=soridata&chart=song&limit=2"
   ```

4. Disable the old theme component or remove its banner outlet code.
5. Enable `kpop_banner_ui_enabled`.
6. Confirm the page has only one `[data-kpop-banner]` root.

Do not run the old theme component and plugin UI as a long-term parallel setup. Use overlap only during the short cutover window.

## Rollback

If the plugin UI causes a layout or data issue:

1. Set `kpop_banner_ui_enabled` to `false`.
2. Re-enable the old theme component only if the site needs an immediate visual fallback.
3. Keep the plugin installed if `/kpop/banner-data` is healthy; the data proxy can remain available while UI is disabled.
4. Confirm there is only one banner on the page.
5. Capture rollback evidence:

   ```bash
   bash plugins/discourse-kpop-banner/scripts/qa/readme_rollout_qa.sh rollback "$BASE_URL" plugins/discourse-kpop-banner/evidence/task-7-rollback.txt
   ```

## Test Commands

Run local plugin tests from this repository:

```bash
npm test
ruby test/data_window_test.rb
ruby -c plugin.rb
ruby -c lib/discourse_kpop_banner/data_window.rb
```

Run Discourse plugin specs from a Discourse checkout:

```bash
cd "$DISCOURSE_ROOT"
bin/rspec plugins/discourse-kpop-banner/spec
bin/rspec plugins/discourse-kpop-banner/spec/system/core_features_spec.rb
```

Run rollout smoke checks:

```bash
bash plugins/discourse-kpop-banner/scripts/qa/readme_rollout_qa.sh install "$BASE_URL" plugins/discourse-kpop-banner/evidence/task-7-install-doc.txt
bash plugins/discourse-kpop-banner/scripts/qa/readme_rollout_qa.sh rollback "$BASE_URL" plugins/discourse-kpop-banner/evidence/task-7-rollback.txt
```

## Common Errors

- `404` or empty data: verify `kpop_banner_data_dir` points to the mounted JSON directory inside the app container.
- `Invalid K-pop banner JSON`: regenerate the source JSON and check file permissions.
- Banner appears twice: disable the old theme component before enabling `kpop_banner_ui_enabled`.
- Anonymous users see too much data: keep `kpop_banner_access_mode` at `public_limited` or stricter, and use `chart` plus `limit` for Soridata requests.
- Group mode denies expected users: confirm `kpop_banner_allowed_groups` includes the Discourse group name and the user is a member.
