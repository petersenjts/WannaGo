import * as cheerio from "cheerio";
import { DISCOVERY_USER_AGENT, isAllowed } from "@/lib/robots";

const PAGE_TIMEOUT_MS = 10000;
const DOMAIN_RATE_LIMIT_MS = 500;
const SITE_TIME_BUDGET_MS = 30000;
const MAX_PAGES = 5; // homepage + up to 4 keyword-matched pages

const PAGE_KEYWORDS: { pageType: string; patterns: RegExp }[] = [
  { pageType: "about", patterns: /about|our-story|history|story/i },
  { pageType: "menu", patterns: /menu|dine|dining|food/i },
  { pageType: "rooms", patterns: /rooms?|accommodation|suites?|stay/i },
];

// Never follow a link to a third-party review/booking site, even if the
// official site itself links out to its own listing there — sources must
// come only from the establishment's own domain.
const THIRD_PARTY_DENYLIST = [
  "google.com",
  "maps.google.com",
  "booking.com",
  "tripadvisor.com",
  "tripadvisor.co.uk",
  "yelp.com",
];

export type ScrapedPage = { url: string; pageType: string; text: string };

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./, "");
}

function isThirdParty(hostname: string): boolean {
  return THIRD_PARTY_DENYLIST.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

function classifyPage(url: string, linkText: string): string {
  const haystack = `${url} ${linkText}`;
  for (const { pageType, patterns } of PAGE_KEYWORDS) {
    if (patterns.test(haystack)) return pageType;
  }
  return "other";
}

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header").remove();
  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": DISCOVERY_USER_AGENT },
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch (err) {
    console.error(`Rejected scrape page ${url}: ${String(err)}`);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrapes an establishment's own official website for About/Story/Menu/Rooms
 * content — never Google Maps, Booking, TripAdvisor, or any review site.
 * Respects robots.txt, rate-limits requests to one domain, and bounds both
 * the number of pages and total time spent on any single site. An empty
 * result is a valid, expected outcome (robots-disallowed, no matching pages,
 * or every page failing) — never thrown as an error.
 */
export async function scrapeWebsite(rootUrl: string): Promise<ScrapedPage[]> {
  let rootHostname: string;
  try {
    rootHostname = normalizeHost(new URL(rootUrl).hostname);
  } catch {
    return [];
  }

  if (!(await isAllowed(rootUrl))) return [];

  const startedAt = Date.now();
  const homepageHtml = await fetchPage(rootUrl);
  if (!homepageHtml) return [];

  const pages: ScrapedPage[] = [];
  const homepageText = extractText(homepageHtml);
  if (homepageText) pages.push({ url: rootUrl, pageType: "home", text: homepageText });

  // Discover same-domain candidate links from the homepage, ranked by
  // keyword match, deduplicated.
  const $ = cheerio.load(homepageHtml);
  const seen = new Set<string>([rootUrl]);
  const candidates: { url: string; pageType: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let absolute: URL;
    try {
      absolute = new URL(href, rootUrl);
    } catch {
      return;
    }
    if (normalizeHost(absolute.hostname) !== rootHostname) return;
    if (isThirdParty(absolute.hostname)) return;
    const url = absolute.toString();
    if (seen.has(url)) return;
    seen.add(url);

    const pageType = classifyPage(url, $(el).text());
    if (pageType === "other") return; // only follow pages that match a known category
    candidates.push({ url, pageType });
  });

  for (const candidate of candidates) {
    if (pages.length >= MAX_PAGES) break;
    if (Date.now() - startedAt > SITE_TIME_BUDGET_MS) break;
    if (!(await isAllowed(candidate.url))) continue;

    await sleep(DOMAIN_RATE_LIMIT_MS);
    const html = await fetchPage(candidate.url);
    if (!html) continue;

    const text = extractText(html);
    if (text) pages.push({ url: candidate.url, pageType: candidate.pageType, text });
  }

  return pages;
}
