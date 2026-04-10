import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

/**
 * Dashboard / home page.
 * Redirects to workspace if logged in, otherwise shows the landing page.
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/workspace");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Pantha Logo" width={80} height={80} />
        </div>

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pantha
          </h1>
          <p className="text-xl text-muted-foreground">
            Your open-source, AI-powered life assistant.
          </p>
          <p className="text-muted-foreground">
            Free. Self-hostable. Bring your own AI.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-left text-sm">
          <div className="p-4 rounded-lg border bg-card">
            <span className="text-2xl">📝</span>
            <h3 className="font-semibold mt-2">Block Editor</h3>
            <p className="text-muted-foreground">
              Rich text editor with headings, lists, code blocks, and more.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <span className="text-2xl">🤖</span>
            <h3 className="font-semibold mt-2">AI Assistant</h3>
            <p className="text-muted-foreground">
              BYO API key. Supports OpenAI, Anthropic, Groq, and Ollama.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <span className="text-2xl">📂</span>
            <h3 className="font-semibold mt-2">Pages & Sub-pages</h3>
            <p className="text-muted-foreground">
              Organize your notes in a nested tree structure.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <span className="text-2xl">🐳</span>
            <h3 className="font-semibold mt-2">Self-Hostable</h3>
            <p className="text-muted-foreground">
              Deploy with Docker Compose. Your data stays yours.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/digitalzenify/pantha"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
