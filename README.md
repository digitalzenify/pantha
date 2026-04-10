<p align="center">
  <img src="public/logo.svg" width="80" alt="Pantha Logo" />
</p>

<h1 align="center">Pantha</h1>
<p align="center"><strong>Your open-source, AI-powered life assistant.</strong></p>
<p align="center">Free. Self-hostable. Bring your own AI.</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#docker">Docker</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#ai-setup">AI Setup</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## What is Pantha?

Pantha (from Greek *panta*, meaning "everything") is an **open-source Notion alternative** with a built-in AI assistant where **you bring your own API key**. It's a self-hostable workspace for notes, documents, and knowledge management — free forever, with no vendor lock-in. Your data stays on your server.

## Features

- 📝 **Pages & Sub-pages** — Organize your notes in a nested tree structure with drag-and-drop
- ✏️ **Block Editor** — Rich text editor with headings, lists, to-do items, code blocks, callouts, and more
- 🤖 **AI Assistant (BYO Key)** — Use OpenAI, Anthropic, Groq, or Ollama with your own API key
- 📥 **Markdown Import/Export** — Import `.md` files or export any page as Markdown
- 🌗 **Dark/Light Mode** — Follows your system preference or manually toggle
- 🐳 **Docker Self-Hosting** — Deploy with a single `docker compose up`
- 🔐 **Authentication** — Built-in auth with email/password, first user becomes admin
- 🗄️ **Databases & Views** — *(coming soon)*
- 🔄 **Real-time Collaboration** — *(coming soon)*

## Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+ (or use Docker)
- **npm** or **pnpm**

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/digitalzenify/pantha.git
cd pantha

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and NEXTAUTH_SECRET

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create your account. The first user to sign up becomes the admin.

## Docker

The easiest way to self-host Pantha is with Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/digitalzenify/pantha.git
cd pantha

# 2. (Optional) Set a secure NEXTAUTH_SECRET
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 3. Start everything
docker compose -f docker/docker-compose.yml up -d
```

Open [http://localhost:3000](http://localhost:3000) and create your account.

To pull the pre-built image from GitHub Container Registry:

```bash
docker pull ghcr.io/digitalzenify/pantha:latest
```

## Configuration

All configuration is done through environment variables. Copy `.env.example` to `.env` and customize:

| Variable | Description | Default | Required |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://pantha:pantha@localhost:5432/pantha` | ✅ |
| `NEXTAUTH_SECRET` | Secret for encrypting session tokens | — | ✅ |
| `NEXTAUTH_URL` | Canonical URL of your instance | `http://localhost:3000` | ✅ |
| `OPENAI_API_KEY` | OpenAI API key (server-wide fallback) | — | ❌ |
| `ANTHROPIC_API_KEY` | Anthropic API key (server-wide fallback) | — | ❌ |
| `GROQ_API_KEY` | Groq API key (server-wide fallback) | — | ❌ |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` | ❌ |

## AI Setup

Pantha supports multiple AI providers. Each user can configure their own:

1. **OpenAI** — GPT-4o, GPT-4o-mini, etc. Get a key at [platform.openai.com](https://platform.openai.com)
2. **Anthropic** — Claude 3 Haiku, Sonnet, Opus. Get a key at [console.anthropic.com](https://console.anthropic.com)
3. **Groq** — Ultra-fast inference with Llama 3, Mixtral. Get a key at [console.groq.com](https://console.groq.com)
4. **Ollama** — Run models locally. No API key needed. Install from [ollama.com](https://ollama.com)

Users can set their API key in the application settings, or admins can set server-wide fallback keys via environment variables.

### Using AI in the Editor

1. Open any page in the editor
2. Click the **✨ Ask AI** button in the toolbar
3. Type your prompt (e.g., "Summarize this page", "Write a conclusion")
4. The AI response is inserted as new blocks in your document

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Block Editor | BlockNote (Notion-style block editor) |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js |
| AI | Multi-provider (OpenAI, Anthropic, Groq, Ollama) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Docker Compose |

## Roadmap

- [x] Pages & sub-pages with block editor
- [x] AI assistant (BYO API key)
- [x] Markdown import/export
- [x] Dark/light mode
- [x] Docker self-hosting
- [x] Authentication (email/password)
- [ ] Databases & custom views (tables, boards, calendars)
- [ ] Real-time collaboration (Yjs + y-websocket)
- [ ] Page templates
- [ ] Public API for integrations
- [ ] Mobile-responsive design
- [ ] Plugin system

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make your changes** and ensure the build passes: `npm run build`
4. **Commit** with a descriptive message: `git commit -m "feat: add my feature"`
5. **Push** to your fork: `git push origin feature/my-feature`
6. **Open a Pull Request** against `main`

### Development Guidelines

- Use TypeScript with strict mode
- Follow the existing code style and patterns
- Write clear commit messages ([Conventional Commits](https://www.conventionalcommits.org/))
- Test your changes locally before submitting

## License

Pantha is open-source software licensed under the [GNU Affero General Public License v3.0](LICENSE).
