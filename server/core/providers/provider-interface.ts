export type ReasoningEffort = "low" | "medium" | "high";

export interface ImageBlock {
  type: "image";
  data: string;
  mimeType: string;
}
