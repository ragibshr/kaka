export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateResult {
  text: string;
  model: string;
  latencyMs: number;
  /** Attempts that failed before this one succeeded (for the Diagnostics log) */
  failures: { model: string; status: number; latencyMs: number; error: string }[];
}

/** What the chat API returns for each fact it saved. */
export interface SavedItem {
  entryId: string;
  category: string;
  label: string;
}

export interface ChatApiResponse {
  reply: string;
  model?: string;
  saved: SavedItem[];
  userMessageId?: string;
  assistantMessageId?: string;
  error?: string;
}
