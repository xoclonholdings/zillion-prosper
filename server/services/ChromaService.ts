import { invokeZcosCapability } from "./ZcosCapabilityClient";

export async function querySimilarResearch(query: string, limit: number): Promise<string> {
  const result = await invokeZcosCapability<{ context?: string }>("/api/capabilities/knowledge/search", {
    body: { query, limit, capability: "zillion.capital.knowledge.read" },
  });
  return String(result.context || "");
}

export async function storeResearchBrief(brief: Record<string, unknown>): Promise<void> {
  await invokeZcosCapability("/api/capabilities/knowledge/contribute", {
    body: { brief, capability: "zillion.capital.knowledge.contribute" },
  });
}
