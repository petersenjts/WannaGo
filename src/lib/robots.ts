import robotsParser from "robots-parser";

/**
 * Identifies the discovery pipeline honestly wherever it fetches a
 * third-party site — used both as the literal request header and as the
 * user-agent string checked against that site's robots.txt, so the check
 * tests the same identity that actually makes the request.
 */
export const DISCOVERY_USER_AGENT = "WannagoContentBot/1.0 (+https://wanna-go.net; content-discovery)";

const ROBOTS_TIMEOUT_MS = 5000;

// Per-origin, for the life of one process/run — not persisted across runs,
// which is fine since each discovery run is short-lived and re-checking
// robots.txt fresh on the next run is the safer default anyway.
const cache = new Map<string, ReturnType<typeof robotsParser>>();

async function getParser(origin: string): Promise<ReturnType<typeof robotsParser>> {
  const cached = cache.get(origin);
  if (cached) return cached;

  const robotsUrl = `${origin}/robots.txt`;
  let body = "";
  try {
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": DISCOVERY_USER_AGENT },
      signal: AbortSignal.timeout(ROBOTS_TIMEOUT_MS),
    });
    if (res.ok) body = await res.text();
  } catch {
    // Missing/unreachable robots.txt — treated as "no restriction" below,
    // the conventional interpretation of an absent robots.txt.
  }

  const parser = robotsParser(robotsUrl, body);
  cache.set(origin, parser);
  return parser;
}

/** Checks whether `siteUrl` may be fetched by our bot per that site's robots.txt. */
export async function isAllowed(siteUrl: string, userAgent: string = DISCOVERY_USER_AGENT): Promise<boolean> {
  const origin = new URL(siteUrl).origin;
  const parser = await getParser(origin);
  const allowed = parser.isAllowed(siteUrl, userAgent);
  // robots-parser returns undefined when it can't determine an answer
  // (e.g. malformed robots.txt) — default to allowed in that case too.
  return allowed !== false;
}
