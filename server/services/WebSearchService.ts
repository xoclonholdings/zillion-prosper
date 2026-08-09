import { invokeZcosCapability } from "./ZcosCapabilityClient";

export interface SearchResponse {
  source: string;
  query: string;
  results: Array<{ title?: string; url?: string; snippet?: string }>;
}

export async function webSearch(query: string, limit = 4): Promise<SearchResponse> {
  return invokeZcosCapability<SearchResponse>("/api/capabilities/web/search", {
    body: { query, limit, capability: "zillion.capital.research" },
  });
}

export function formatResultsForPrompt(response: SearchResponse): string {
  if (!response.results?.length) return `No web results for: ${response.query}`;
  return response.results
    .map((result, index) => `[${index + 1}] ${result.title || "Untitled"}\n${result.snippet || ""}\n${result.url || ""}`)
    .join("\n\n");
}
