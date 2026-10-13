// Thin wrapper around the Claude Messages API — no SDK dependency, matching
// this codebase's preference for calling third-party REST APIs directly
// (see google-places.ts). The API key is checked lazily inside the function
// so a missing key only fails an actual generation attempt.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5-5";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_SOURCE_CHARS = 4000; // per source page, keeps input tokens predictable

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return key;
}

export type ListingContentInput = {
  name: string;
  vertical: "STAY" | "DINE";
  formattedAddress: string;
  neighborhood: string | null;
  priceLevel: number | null;
  rating: number | null;
  reviewCount: number | null;
  cuisine: string | null;
  sources: { url: string; text: string }[];
};

export type ListingContent = {
  shortDescription: string;
  longDescription: string;
  uncertainClaims: string[];
};

const SYSTEM_PROMPT = `You write short, editorial descriptions of hotels and restaurants for a curated travel-discovery catalog. This is a batch content-generation job, not a conversation — respond only with the requested structured output.

Strict grounding rule: use ONLY facts present in the supplied sources (the Google Places data and the scraped website text below). Never invent dates, names, awards, chefs, owners, or history that are not explicitly present in the sources. If the sources contain no story or history, write about the place's character, location, and offering instead, and say nothing about its history.

Write:
- A short description: 1-2 sentences, for a catalog card.
- A long description: 3-5 short paragraphs, warm and editorial in tone, no hype or marketing cliches, separated by blank lines. Include the place's story only where the sources actually support one.
- A list of any claims in your output you are even slightly unsure are fully supported by the sources (can be empty).`;

function buildUserMessage(input: ListingContentInput): string {
  const facts = [
    `Name: ${input.name}`,
    `Type: ${input.vertical === "STAY" ? "Hotel" : "Restaurant"}`,
    `Address: ${input.formattedAddress}`,
    input.neighborhood ? `Neighborhood: ${input.neighborhood}` : null,
    input.priceLevel ? `Price level: ${"€".repeat(input.priceLevel)}` : null,
    input.rating ? `Google rating: ${input.rating} (${input.reviewCount ?? 0} reviews)` : null,
    input.cuisine ? `Cuisine/type: ${input.cuisine}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const sources =
    input.sources.length > 0
      ? input.sources
          .map((s) => `### Source: ${s.url}\n${s.text.slice(0, MAX_SOURCE_CHARS)}`)
          .join("\n\n")
      : "(No official website was available — write from the Google Places facts above only.)";

  return `## Facts\n${facts}\n\n## Sources\n${sources}`;
}

export async function generateListingContent(input: ListingContentInput): Promise<ListingContent> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey(),
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserMessage(input) }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              shortDescription: { type: "string" },
              longDescription: { type: "string" },
              uncertainClaims: { type: "array", items: { type: "string" } },
            },
            required: ["shortDescription", "longDescription", "uncertainClaims"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API request failed (${res.status}): ${body || res.statusText}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude API response had no text content");
  }

  const parsed = JSON.parse(textBlock.text) as ListingContent;
  return {
    shortDescription: parsed.shortDescription ?? "",
    longDescription: parsed.longDescription ?? "",
    uncertainClaims: Array.isArray(parsed.uncertainClaims) ? parsed.uncertainClaims : [],
  };
}
