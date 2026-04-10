import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAICompletion, type AIProvider } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai
 * Proxy AI completion requests to the user's configured provider.
 * Body: { prompt, context?, provider?, apiKey?, model?, maxTokens? }
 *
 * The API key can come from:
 * 1. The request body (for client-side stored keys)
 * 2. The user's database record (encrypted key stored server-side)
 * 3. Server environment variables (fallback)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  let body: {
    prompt: string;
    context?: string;
    provider?: AIProvider;
    apiKey?: string;
    model?: string;
    maxTokens?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 }
    );
  }

  // Resolve the AI provider and key
  let provider = body.provider;
  let apiKey = body.apiKey;
  let baseUrl: string | undefined;

  // If not provided in body, check user's stored settings
  if (!provider || !apiKey) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiProvider: true, aiApiKey: true, aiBaseUrl: true },
    });

    if (user?.aiProvider) {
      provider = provider || (user.aiProvider as AIProvider);
      apiKey = apiKey || user.aiApiKey || undefined;
      baseUrl = user.aiBaseUrl || undefined;
    }
  }

  // Fallback to environment variables
  if (!apiKey && provider) {
    const envKeys: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      groq: process.env.GROQ_API_KEY,
    };
    apiKey = envKeys[provider] || undefined;
  }

  if (provider === "ollama") {
    baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
    apiKey = apiKey || "ollama"; // Ollama doesn't need a real key
  }

  if (!provider) {
    return NextResponse.json(
      {
        error:
          "No AI provider configured. Please set up your AI provider in settings.",
      },
      { status: 400 }
    );
  }

  if (!apiKey && provider !== "ollama") {
    return NextResponse.json(
      {
        error: `No API key found for ${provider}. Please add your API key in settings.`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await getAICompletion({
      provider,
      apiKey: apiKey || "",
      baseUrl,
      model: body.model,
      prompt: body.prompt,
      context: body.context,
      maxTokens: body.maxTokens,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
