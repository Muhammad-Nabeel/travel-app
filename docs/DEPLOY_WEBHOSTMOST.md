# Deploying to WebHostMost (cPanel Node.js)

WebHostMost runs Node apps through cPanel's **Setup Node.js App** (Phusion
Passenger). Shared plans don't have enough memory to run `next build` on the
server, so we build a self-contained bundle locally (`output: "standalone"`)
and upload only that. The bundle contains its own trimmed `node_modules`, so
**do not** run "NPM Install" in cPanel.

The PostgreSQL database (`server6.webhostmost.com`) is set up separately; migrations run from your machine, not from the app.

## 1. Build the bundle (on your machine)

Production settings live in `.env.server` (gitignored, never committed). The
script uses its `NEXT_PUBLIC_*`, `SITE_URL` and `CLOUDFLARE_R2_PUBLIC_URL`
values for the build, and ships the file inside the zip as `.env`. The
build itself still prerenders against the database URL in your local `.env`.

```bash
npm ci
npm run package:webhostmost
```

This creates `dist/travel-app-YYYYMMDD-HHMM.zip` (~26 MB) containing
`server.js`, `.env`, `.next/`, `public/` and `node_modules/`. The zip contains
secrets, so don't share it.

## 2. Apply database migrations (on your machine)

```bash
npm run prisma:deploy
```

This runs against `DIRECT_URL` from your local `.env`. Do this before
switching traffic to a build that needs new migrations.

## 3. Create the Node.js app (first deploy only)

cPanel → **Setup Node.js App** → **Create Application**:

| Field                    | Value                                   |
| ------------------------ | --------------------------------------- |
| Node.js version          | 20.x or 22.x (minimum 20.9 for Next.js 16) |
| Application mode         | Production                              |
| Application root         | `domains/easytrip.com.pk/public_html`    |
| Application URL          | your domain, e.g. `example.com`         |
| Application startup file | `server.js`                             |

Click **Create**, then **Stop App** before uploading files.

## 4. Upload the bundle

1. cPanel → **File Manager** → open `~/domains/easytrip.com.pk/public_html`.
2. Delete everything there **except** `.htaccess` (cPanel wrote it), plus `tmp/` if present.
3. Upload the zip → right-click → **Extract** → delete the zip.
4. Enable **Settings → Show Hidden Files** and confirm `.next/` is present.
   Some upload tools skip dot-folders; without `.next/` the app won't start.

## 5. Environment variables

Nothing to enter: the server reads `~/domains/easytrip.com.pk/public_html/.env` (from `.env.server`)
at startup. Any variable you add under **Environment variables** in
**Setup Node.js App** takes precedence over the file, which is handy for a
quick override without rebuilding.

The database URLs use `localhost:5432` with `sslmode=disable` because the app
and PostgreSQL run on the same server. If the app logs a `pg_hba.conf` error,
change the host back to `server6.webhostmost.com` in `.env.server` and rebuild.

Don't set `PORT`; Passenger assigns it. Click **Start App** (or **Restart**
on later deploys).

## 6. External services

- **Google OAuth**: add
  `https://easytrip.com.pk/api/auth/callback/google` as an authorized
  redirect URI in Google Cloud Console.
- **Resend**: verify the domain used in `EMAIL_FROM`.
- **SSL**: cPanel → **SSL/TLS Status** → run AutoSSL for the domain.

## Updating the site

1. `npm run package:webhostmost` locally (and `npm run prisma:deploy` if
   there are new migrations).
2. **Stop App** → replace the contents of `~/domains/easytrip.com.pk/public_html` (keep `.htaccess`) →
   extract the new zip → **Start App**.

## Alternative: install packages on the server

`npm run package:webhostmost:npm` builds `dist/travel-app-npm-*.zip`
(~18 MB) without `node_modules`. Its `server.js` is a small custom server that
loads Next.js from packages installed on the server. Run `npm ci` locally
first: the script stops if the installed Next.js version doesn't match
`package-lock.json`, since the build only works with the exact version the
server installs.

1. **Stop App**, empty `~/domains/easytrip.com.pk/public_html` (keep `.htaccess`), upload the zip to
   `~` and extract it from the terminal so the symlinks in
   `.next/node_modules` survive:
   `unzip -q ~/travel-app-npm-*.zip -d ~/domains/easytrip.com.pk/public_html`
2. Click **Run NPM Install** in Setup Node.js App.
3. In the terminal:
   `source ~/nodevenv/domains/easytrip.com.pk/public_html/20/bin/activate && cd ~/domains/easytrip.com.pk/public_html && npx prisma generate`
4. **Start App**.

Repeat steps 2–3 on every deploy, as the build may need different package
versions.

## Troubleshooting

- **Logs**: `~/domains/easytrip.com.pk/public_html/stderr.log` (or the log path shown in the app page).
  Via SSH you can also run
  `source ~/nodevenv/domains/easytrip.com.pk/public_html/20/bin/activate && cd ~/domains/easytrip.com.pk/public_html && node server.js`
  to see startup errors directly.
- **503 / "Incomplete response"**: usually a missing env var (e.g. `DATABASE_URL`)
  or a missing `.next/` folder.
- **`ENOENT ... .next/server/preview-props.json`**: the server installed a
  different Next.js version than the build used. Check with
  `node -p "require('next/package.json').version"`, then rebuild with
  `npm run package:webhostmost:npm` (it pins exact versions) and reinstall.
- **Sign-in redirects to localhost**: `NEXTAUTH_URL` is wrong or unset.
- **Images from R2 blocked**: `CLOUDFLARE_R2_PUBLIC_URL` was missing at
  build time. Rebuild with it set.
- **Out of memory / app killed**: lower `PG_POOL_MAX` or raise the plan's
  memory limit (CloudLinux LVE).
