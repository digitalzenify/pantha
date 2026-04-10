/**
 * AI Provider Helper
 * Routes requests to the user's configured LLM provider.
 * Supports: OpenAI, Anthropic, Groq, Ollama
 */

export type AIProvider = "openai" | "anthropic" | "groq" | "ollama";

interface AIRequestOptions {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  prompt: string;
  context?: string;
  maxTokens?: number;
}

interface AIResponse {
  text: string;
  model: string;
  provider: AIProvider;
}

/** Default models for each provider */
const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  groq: "llama-3.1-8b-instant",
  ollama: "llama3.2",
};

/** Base URLs for each provider */
const BASE_URLS: Record<AIProvider, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  groq: "https://api.groq.com/openai/v1",
  ollama: "http://localhost:11434/v1",
};

/**
 * Sends a completion request to the configured AI provider.
 * Uses the OpenAI-compatible chat completions API format for
 * OpenAI, Groq, and Ollama. Anthropic uses its own messages API.
 */
export async function getAICompletion(
  options: AIRequestOptions
): Promise<AIResponse> {
  const {
    provider,
    apiKey,
    baseUrl,
    prompt,
    context,
    maxTokens = 1024,
  } = options;
  const model = options.model || DEFAULT_MODELS[provider];
  const url = baseUrl || BASE_URLS[provider];

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a helpful writing assistant embedded in a note-taking app called Pantha. " +
        "Help the user with their request. Be concise and helpful. " +
        "Format your response in plain text or Markdown as appropriate.",
    },
    ...(context
      ? [{ role: "user" as const, content: `Context:\n${context}` }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  if (provider === "anthropic") {
    return callAnthropic({ url, apiKey, model, messages, maxTokens });
  }

  // OpenAI-compatible API (OpenAI, Groq, Ollama)
  return callOpenAICompatible({
    url,
    apiKey,
    model,
    messages,
    maxTokens,
    provider,
  });
}

async function callOpenAICompatible(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
  provider: AIProvider;
}): Promise<AIResponse> {
  const { url, apiKey, model, messages, maxTokens, provider } = params;

  const response = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `${provider} API error (${response.status}): ${error}`
    );
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    model,
    provider,
  };
}

async function callAnthropic(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
}): Promise<AIResponse> {
  const { url, apiKey, model, messages, maxTokens } = params;

  // Extract system message and convert to Anthropic format
  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const userMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await fetch(`${url}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: userMessages,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Anthropic API error (${response.status}): ${error}`
    );
  }

  const data = await response.json();
  return {
    text: data.content?.[0]?.text || "",
    model,
    provider: "anthropic",
  };
}

/** Returns the list of supported providers with display info */
export function getProviders() {
  return [
    { id: "openai" as const, name: "OpenAI", requiresKey: true },
    { id: "anthropic" as const, name: "Anthropic", requiresKey: true },
    { id: "groq" as const, name: "Groq", requiresKey: true },
    { id: "ollama" as const, name: "Ollama (Local)", requiresKey: false },
  ];
}
