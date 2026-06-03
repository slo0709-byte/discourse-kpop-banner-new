#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s install|rollback BASE_URL EVIDENCE_PATH\n' "$0" >&2
}

if [[ $# -ne 3 ]]; then
  usage
  exit 2
fi

action="$1"
base_url="${2%/}"
evidence_path="$3"

case "$action" in
  install|rollback) ;;
  *)
    usage
    exit 2
    ;;
esac

mkdir -p "$(dirname "$evidence_path")"

{
  printf 'action=%s\n' "$action"
  printf 'base_url=%s\n' "$base_url"
  printf 'started_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  if [[ "$action" == "install" ]]; then
    curl -fsS -o /dev/null -w 'home_status=%{http_code}\n' "$base_url/"
    curl -fsS -o /dev/null -w 'banner_status=%{http_code}\n' "$base_url/kpop/banner-data?source=soridata&chart=song&limit=1"
  else
    curl -fsS -o /dev/null -w 'home_status=%{http_code}\n' "$base_url/"
  fi

  printf 'finished_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} | tee "$evidence_path"
