import { generateChatFromProvider } from "../../services/ModelProviderService";

export async function executeProviderChat(
  messages: Array<{ role: string; content: string }>,
  options: Record<string, unknown> = {},
): Promise<string> {
  const systemPrompt = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const conversational = messages.filter((message) => message.role !== "system");
  return generateChatFromProvider(conversational, systemPrompt, options as any);
}
