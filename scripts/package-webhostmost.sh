#!/usr/bin/env bash
# Builds the standalone Next.js server and zips it for upload to WebHostMost
# (cPanel "Setup Node.js App"). See docs/DEPLOY_WEBHOSTMOST.md.
set -euo pipefail

cd "$(dirname "$0")/.."

SERVER_ENV=.env.server

# Values inlined at build time must come from the production env, while the
# rest of the build (prerendering) keeps using the local .env database URL.
if [ -f "$SERVER_ENV" ]; then
  while IFS= read -r line; do
    export "$line"
  done < <(grep -E '^(NEXT_PUBLIC_[A-Z0-9_]*|SITE_URL|CLOUDFLARE_R2_PUBLIC_URL)=' "$SERVER_ENV" | sed -E 's/^([^=]+)="(.*)"$/\1=\2/')
else
  echo "Warning: $SERVER_ENV not found; NEXT_PUBLIC_* values come from .env" >&2
fi

npm run build

STANDALONE=.next/standalone
if [ ! -f "$STANDALONE/server.js" ]; then
  echo "Missing $STANDALONE/server.js - is output: \"standalone\" set in next.config.ts?" >&2
  exit 1
fi

# server.js only serves these if they sit next to it.
cp -r public "$STANDALONE/"
mkdir -p "$STANDALONE/.next"
cp -r .next/static "$STANDALONE/.next/"

# Never ship the local dev env; ship the production env as .env if present.
rm -f "$STANDALONE"/.env "$STANDALONE"/.env.*
if [ -f "$SERVER_ENV" ]; then
  cp "$SERVER_ENV" "$STANDALONE/.env"
fi

mkdir -p dist
ARCHIVE="dist/travel-app-$(date +%Y%m%d-%H%M).zip"
(cd "$STANDALONE" && zip -qr "../../$ARCHIVE" .)

echo "Created $ARCHIVE"
