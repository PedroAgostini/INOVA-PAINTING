#!/usr/bin/env bash
# Bumps the ?v= version on every CSS/JS link so browsers and the
# Hostinger/LiteSpeed cache fetch the new files after a deploy.
# Usage (from the project root):  bash scripts/clean-cache.sh
set -euo pipefail
cd "$(dirname "$0")/.."
V="$(date +%Y%m%d%H%M)"
for f in *.html; do
  sed -i -E "s#(\.(css|js))(\?v=[0-9A-Za-z]+)?\"#\1?v=${V}\"#g" "$f"
done
echo "Cache version set to v=${V} in: $(ls *.html | tr '\n' ' ')"
echo "If the site still looks old: hPanel > Advanced > Cache Manager > Purge all."
