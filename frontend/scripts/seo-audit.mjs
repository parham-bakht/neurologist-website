const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
const canonicalUrl = (process.env.SEO_AUDIT_CANONICAL_URL || baseUrl).replace(/\/$/, "");

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
  });
  const body = await response.text();
  return { response, body };
}

function validateJsonLd(html, pageName) {
  const scripts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  check(scripts.length > 0, `${pageName}: missing JSON-LD`);
  for (const [, source] of scripts) {
    try {
      JSON.parse(source);
    } catch {
      failures.push(`${pageName}: invalid JSON-LD`);
    }
  }
}

const robots = await request("/robots.txt");
check(robots.response.status === 200, "robots.txt: expected 200");
check(robots.body.includes("Disallow: /dashboard/"), "robots.txt: dashboard rule missing");
check(robots.body.includes("Sitemap:"), "robots.txt: sitemap reference missing");

const sitemap = await request("/sitemap.xml");
check(sitemap.response.status === 200, "sitemap.xml: expected 200");
check(sitemap.body.includes(`${canonicalUrl}/articles`), "sitemap.xml: article index missing");

const home = await request("/");
check(home.response.status === 200, "homepage: expected 200");
check(/<title>[^<]+<\/title>/i.test(home.body), "homepage: title missing");
check(/<meta[^>]+name="description"/i.test(home.body), "homepage: description missing");
check(
  home.body.includes(`rel="canonical" href="${canonicalUrl}"`) ||
    home.body.includes(`rel="canonical" href="${canonicalUrl}/"`),
  "homepage: canonical missing",
);
check(home.body.includes('"@type":"WebSite"'), "homepage: WebSite schema missing");
check(home.body.includes('"@type":"Person"'), "homepage: Person schema missing");
check(/<h1[ >]/i.test(home.body), "homepage: H1 missing");
validateJsonLd(home.body, "homepage");

const articles = await request("/articles");
check(articles.response.status === 200, "article index: expected 200");
check(articles.body.includes(`rel="canonical" href="${canonicalUrl}/articles"`), "article index: canonical missing");
check(articles.body.includes('"@type":"BreadcrumbList"'), "article index: breadcrumbs schema missing");
check(/<h1[ >]/i.test(articles.body), "article index: H1 missing");
validateJsonLd(articles.body, "article index");

const articleMatches = [...sitemap.body.matchAll(/<loc>([^<]+\/articles\/[^<]+)<\/loc>/g)];
check(articleMatches.length > 0, "sitemap.xml: no published article URL found");
if (articleMatches.length > 0) {
  const articleUrl = new URL(articleMatches[0][1]);
  const article = await request(`${articleUrl.pathname}${articleUrl.search}`);
  check(article.response.status === 200, "published article: expected 200");
  check(article.body.includes(`rel="canonical" href="${canonicalUrl}${articleUrl.pathname}"`), "published article: canonical missing");
  check(article.body.includes('property="og:type" content="article"'), "published article: article Open Graph type missing");
  check(article.body.includes('"@type":"BlogPosting"'), "published article: BlogPosting schema missing");
  check(/<h1[ >]/i.test(article.body), "published article: H1 missing");
  validateJsonLd(article.body, "published article");
}

const missing = await request("/articles/seo-audit-missing-article");
check(missing.response.status === 404, `missing article: expected 404, received ${missing.response.status}`);
check(/name="robots" content="noindex/i.test(missing.body), "missing article: noindex missing");

const login = await request("/login");
check(login.response.status === 200, "login: expected 200");
check((login.response.headers.get("x-robots-tag") || "").includes("noindex"), "login: X-Robots-Tag missing");
check(/name="robots" content="noindex/i.test(login.body), "login: robots noindex meta missing");

for (const path of ["/manifest.webmanifest", "/favicon.ico", "/og-default.jpg"]) {
  const asset = await request(path);
  check(asset.response.status === 200, `${path}: expected 200`);
}

for (const html of [home.body, articles.body]) {
  check(!/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com/i.test(html), "public page: remote font or icon dependency found");
}

if (failures.length > 0) {
  console.error(`SEO audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`SEO audit passed for ${baseUrl}`);
