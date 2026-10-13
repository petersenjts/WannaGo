// Second-pass grounding check — plain fetch, same house style as
// claude-content.ts and google-places.ts (lazy env check, AbortSignal
// timeout, throws a descriptive Error on non-OK, no SDK dependency).

import type { ClaudeUsage } from "@/lib/claude-content";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5-5";
const REQUEST_TIMEOUT_MS = 30000;

function apiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return key;
}

export type ClaimCheck = { text: string; supported: boolean; note: string | null };

export type VerifyClaimsInput = {
  shortDescription: string;
  longDescription: string;
  /** The same Google Places facts block the generator was given — without
   * this, legitimate claims drawn from Google data (price, rating, review
   * count, neighborhood) would be wrongly flagged unsupported, since they
   * never appear in the scraped website text. */
  facts: string;
  sources: { url: string; text: string }[];
};

export type VerifyClaimsResult = {
  claims: ClaimCheck[];
  usage: ClaudeUsage;
};

const SYSTEM_PROMPT = `You fact-check a generated listing description against its source material. This is a batch verification job, not a conversation — respond only with the requested structured output.

From the two description fields below, extract every atomic, checkable factual claim — a year, a person's name, an award, a specific dish, a design or architectural detail, an opening date, a capacity or size, a specific amenity. Do NOT extract vague editorial color ("charming", "cozy", "a favorite among locals") — those aren't checkable claims, skip them.

For each extracted claim, check whether it is actually supported by the supplied source material, which has two parts: a trusted facts block (structured data from Google Places — address, price level, rating, review count, neighborhood, cuisine) and the scraped website text. Both count as valid support. Mark "supported": true only if either part contains that specific fact (paraphrasing is fine, invention is not). Mark "supported": false if the claim isn't present in either, contradicts them, or is more specific than what they actually say. When unsupported, give a short one-sentence "note" explaining what's missing; when supported, "note" should be null.

If there are no extractable factual claims at all, return an empty claims array.`;

function buildUserMessage(input: VerifyClaimsInput): string {
  const sources =
    input.sources.length > 0
      ? input.sources.map((s) => `### Source: ${s.url}\n${s.text}`).join("\n\n")
      : "(no website sources)";

  return `## Generated short description\n${input.shortDescription}\n\n## Generated long description\n${input.longDescription}\n\n## Trusted facts (Google Places)\n${input.facts}\n\n## Website sources\n${sources}`;
}

export async function verifyClaims(input: VerifyClaimsInput): Promise<VerifyClaimsResult> {
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
              claims: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    supported: { type: "boolean" },
                    note: { type: ["string", "null"] },
                  },
                  required: ["text", "supported", "note"],
                  additionalProperties: false,
                },
              },
            },
            required: ["claims"],
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
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Claude API response had no text content");
  }

  const parsed = JSON.parse(textBlock.text) as { claims?: ClaimCheck[] };
  return {
    claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
  };
}
