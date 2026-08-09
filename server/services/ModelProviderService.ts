import type { ImageBlock, ReasoningEffort } from "../core/providers/provider-interface";
import { invokeZcosCapability } from "./ZcosCapabilityClient";

export async function generateChatFromProvider(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  options: { lane?: string; attachments?: ImageBlock[]; reasoningEffort?: ReasoningEffort } = {},
): Promise<string> {
  const result = await invokeZcosCapability<{ message?: string; reply?: string }>("/api/capabilities/model/chat", {
    body: { messages, systemPrompt, ...options, capability: "zillion.capital.analysis" },
  });
  return String(result.message || result.reply || "");
}
