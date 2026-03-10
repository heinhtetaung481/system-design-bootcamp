# System Design Bootcamp

An AI-powered system design learning app built with Next.js. Master distributed systems, databases, caching, and more — with AI-generated lessons, interactive architecture diagrams, practice Q&A, and a live Ask AI tab.

## Features

- **7 phases, 30+ topics** — structured curriculum from networking basics to FAANG-level system design
- **AI-generated lessons** — cached in Supabase, served instantly on repeat visits
- **Regenerate button** — force fresh AI content on any topic
- **Switch AI providers** — toggle between Anthropic Claude and OpenAI GPT-4o
- **Architecture diagrams** — interactive SVG diagrams for every major topic
- **Practice Q&A** — flip-card style practice questions with reveal
- **Ask AI** — ask follow-up questions about any topic
- **Progress tracking** — persisted in localStorage
- **Mobile-friendly** — fixed bottom tab bar + slide-in sidebar on small screens

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) and/or [OpenAI API key](https://platform.openai.com)
- (Optional) A [Supabase](https://supabase.com) project for lesson caching

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# AI Providers — add at least one
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Supabase (optional — app works without it, just won't cache lessons)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up Supabase (optional)

If you want lesson caching, run `supabase-schema.sql` in your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste the contents of `supabase-schema.sql` and run it

This creates three tables:
- `lessons` — cached AI-generated lesson content (keyed by topic + provider)
- `user_progress` — session-based progress tracking
- `ask_responses` — logged Q&A from the Ask AI tab

Without Supabase, the app still works — lessons are generated fresh on every request.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Lesson caching

When you visit a topic, the app calls `/api/generate-lesson`:

1. Checks Supabase for a cached lesson (same topic + same AI provider)
2. Returns cached content immediately if found (shows a "Cached" badge)
3. Otherwise calls the AI provider, stores the result in Supabase, and returns it

The **Regenerate** button bypasses the cache (`forceRegenerate: true`) to get fresh content.

### AI provider switching

The model selector at the top of the page switches between providers. Each provider has its own cache entry per topic — switching provider triggers a fresh fetch.

| Provider | Model |
|---|---|
| Anthropic | `claude-sonnet-4-20250514` |
| OpenAI | `gpt-4o` |

### API routes

| Route | Description |
|---|---|
| `POST /api/generate-lesson` | Generate or fetch cached lesson content |
| `POST /api/ask` | Ask a follow-up question about a topic |

## Project Structure

```
system-design-bootcamp/
├── app/
│   ├── api/
│   │   ├── generate-lesson/route.ts   # Lesson generation + Supabase cache
│   │   └── ask/route.ts               # Ask AI endpoint
│   ├── globals.css                    # All styles (prose, callouts, diagrams)
│   ├── layout.tsx
│   └── page.tsx                       # Main app shell
├── components/
│   ├── AskTab.tsx                     # Ask AI tab
│   ├── DiagramTab.tsx                 # Diagram viewer tab
│   ├── LearnTab.tsx                   # Lesson tab with regenerate
│   ├── ModelSelector.tsx              # AI provider switcher
│   ├── PracticeTab.tsx                # Practice Q&A tab
│   ├── Sidebar.tsx                    # Navigation sidebar
│   └── diagrams.tsx                   # All SVG architecture diagrams
├── lib/
│   ├── ai-providers.ts                # Anthropic + OpenAI abstraction
│   ├── curriculum.ts                  # Full 7-phase curriculum data
│   └── supabase.ts                    # Lazy-initialized Supabase clients
├── types/
│   └── index.ts                       # TypeScript interfaces
├── supabase-schema.sql                # SQL to set up Supabase tables
└── .env.local.example                 # Environment variable template
```

## Deployment

Deploy to Vercel with zero config — just add your environment variables in the Vercel dashboard.

```bash
vercel deploy
```
