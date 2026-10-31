#!/usr/bin/env bash
# Builds the app and zips it WITHOUT node_modules, for servers where packages
# are installed with cPanel/DirectAdmin "Run NPM Install".
# See docs/DEPLOY_WEBHOSTMOST.md.
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

# The server installs from package-lock.json, so the build must use the same
# Next.js version or every page fails at runtime.
LOCKED_NEXT=$(node -p "require('./package-lock.json').packages['node_modules/next'].version")
INSTALLED_NEXT=$(node -p "require('next/package.json').version")
if [ "$LOCKED_NEXT" != "$INSTALLED_NEXT" ]; then
  echo "next $INSTALLED_NEXT is installed but package-lock.json has $LOCKED_NEXT. Run npm ci first." >&2
  exit 1
fi

npm run build

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

cp package.json package-lock.json next.config.ts prisma.config.ts "$STAGE/"
# "Run NPM Install" doesn't always honour package-lock.json, and a newer
# Next.js can't run this build, so pin direct dependencies to the locked
# versions.
node -e '
const fs = require("fs");
const file = process.argv[1];
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
const lock = require("./package-lock.json").packages;
for (const field of ["dependencies", "devDependencies"]) {
  for (const name of Object.keys(pkg[field] || {})) {
    const locked = lock["node_modules/" + name];
    if (locked) pkg[field][name] = locked.version;
  }
}
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$STAGE/package.json"
cp scripts/webhostmost-server.js "$STAGE/server.js"
cp -r public "$STAGE/"
mkdir -p "$STAGE/prisma"
cp -r prisma/schema.prisma prisma/migrations "$STAGE/prisma/"
# The standalone copy and build cache aren't needed to run the app.
mkdir -p "$STAGE/.next"
(cd .next && tar cf - --exclude=./standalone --exclude=./cache --exclude=./dev --exclude=./node_modules .) | (cd "$STAGE/.next" && tar xf -)
# Turbopack loads server packages through hashed aliases (e.g.
# @prisma/client-<hash>) that are symlinks into node_modules. The standalone
# step moves them under .next/standalone, so take them from there.
cp -a .next/standalone/.next/node_modules "$STAGE/.next/"

if [ -f "$SERVER_ENV" ]; then
  cp "$SERVER_ENV" "$STAGE/.env"
fi

mkdir -p dist
ARCHIVE="dist/travel-app-npm-$(date +%Y%m%d-%H%M).zip"
# -y keeps the alias symlinks as links; their targets only exist after
# npm install on the server.
(cd "$STAGE" && zip -qry "$OLDPWD/$ARCHIVE" .)

echo "Created $ARCHIVE"
