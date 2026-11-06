#!/usr/bin/env node
// Crawl every URL in sitemap.xml and verify per-page SEO essentials:
// unique <title>, unique meta description, canonical, valid JSON-LD, one <h1>.
//
// Usage:
//   node scripts/seo-check.mjs http://localhost:3004
//   node scripts/seo-check.mjs https://your-live-domain.com --json > seo-report.json
//
// Exit code 1 if any page has a problem (usable in CI).

const base = (process.argv[2] || "http://localhost:3004").replace(/\/$/, "");
const asJson = process.argv.includes("--json");
const CONCURRENCY = 6;

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .trim();

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return m ? decode(m[1]) : null;
};

async function getSitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sitemap ${url} -> HTTP ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(xml)) {
    const nested = await Promise.all(locs.map((l) => getSitemapUrls(l, seen)));
    return nested.flat();
  }
  return locs;
}

function analyse(html) {
  const head = html.split(/<\/head>/i)[0];
  const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]));
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);

  const metaBy = (key, val) =>
    metas.filter((t) => (attr(t, key) || "").toLowerCase() === val).map((t) => attr(t, "content"));

  const jsonLd = [];
  const jsonLdErrors = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const it of items) jsonLd.push([].concat(it["@type"]).join("/"));
    } catch (e) {
      jsonLdErrors.push(e.message);
    }
  }

  return {
    titles,
    description: metaBy("name", "description"),
    robots: metaBy("name", "robots")[0] || null,
    ogTitle: metaBy("property", "og:title")[0] || null,
    canonical: links.filter((t) => /rel=["']canonical["']/i.test(t)).map((t) => attr(t, "href")),
    h1Count: (html.match(/<h1[\s>]/gi) || []).length,
    jsonLd,
    jsonLdErrors,
  };
}

async function checkPage(url) {
  try {
    const res = await fetch(url, { redirect: "manual", // Googlebot UA: Next.js streams metadata into <body> for normal browsers but
      // renders it in <head> for crawlers, so this shows what Google actually gets.
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } });
    if (res.status !== 200) return { url, status: res.status, issues: [`HTTP ${res.status}`] };
    const a = analyse(await res.text());
    const issues = [];
    if (a.titles.length !== 1) issues.push(`${a.titles.length} <title> tags`);
    if (a.titles[0] !== undefined && !a.titles[0]) issues.push("empty title");
    const tl = (a.titles[0] || "").length;
    if (tl && (tl < 15 || tl > 65)) issues.push(`title length ${tl} (aim 15-65)`);
    if (a.description.length !== 1 || !a.description[0]) issues.push("missing/duplicate meta description");
    const dl = (a.description[0] || "").length;
    if (dl && (dl < 50 || dl > 165)) issues.push(`description length ${dl} (aim 50-165)`);
    if (a.canonical.length !== 1) issues.push(`${a.canonical.length} canonical tags`);
    else if (a.canonical[0].replace(/\/$/, "") !== url.replace(/\/$/, ""))
      issues.push(`canonical points elsewhere: ${a.canonical[0]}`);
    if (a.robots && /noindex/i.test(a.robots)) issues.push(`robots: ${a.robots} (but listed in sitemap)`);
    if (!a.jsonLd.length) issues.push("no JSON-LD structured data");
    for (const e of a.jsonLdErrors) issues.push(`invalid JSON-LD: ${e}`);
    if (a.h1Count !== 1) issues.push(`${a.h1Count} <h1> tags`);
    return { url, status: 200, ...a, issues };
  } catch (e) {
    return { url, status: 0, issues: [`fetch failed: ${e.message}`] };
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

// Sitemap URLs use the production domain; when checking locally, rewrite them.
const urls = (await getSitemapUrls(`${base}/sitemap.xml`)).map((u) => {
  const p = new URL(u);
  return base + p.pathname + p.search;
});

const results = await pool(urls, CONCURRENCY, checkPage);

// Cross-page duplicate checks
for (const field of ["titles", "description"]) {
  const groups = new Map();
  for (const r of results) {
    const v = r[field]?.[0];
    if (v) groups.set(v, [...(groups.get(v) || []), r]);
  }
  for (const [v, rs] of groups)
    if (rs.length > 1)
      for (const r of rs)
        r.issues.push(`duplicate ${field === "titles" ? "title" : "description"} shared with ${rs.length - 1} other page(s): "${v.slice(0, 60)}"`);
}

const bad = results.filter((r) => r.issues.length);

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    const mark = r.issues.length ? "✗" : "✓";
    console.log(`${mark} ${r.url}`);
    if (r.titles) console.log(`    title: ${r.titles[0] ?? "-"}`);
    if (r.jsonLd) console.log(`    json-ld: ${r.jsonLd.join(", ") || "-"}`);
    for (const i of r.issues) console.log(`    ! ${i}`);
  }
  console.log(`\n${urls.length} pages checked, ${bad.length} with issues.`);
}
process.exit(bad.length ? 1 : 0);
