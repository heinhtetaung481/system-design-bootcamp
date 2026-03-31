# System Design Bootcamp

System Design Bootcamp is an AI-powered educational web application designed to teach software engineers about system design. The application leverages modern web technologies and AI capabilities to provide dynamic, generated lesson content, diagrams, and interactive Q&A.

## Key Features
- **AI-Generated Curriculum:** Lessons are dynamically generated using models from Anthropic (Claude) and OpenAI (GPT), with caching mechanisms in place to avoid redundant AI calls.
- **Interactive Diagrams:** AI-driven generation of architecture diagrams mapping to the curriculum.
- **Q&A System:** Interactive "Ask" functionality allows users to query an AI model on specific system design topics.
- **User Progress Tracking:** Tracks the user's progress through the curriculum.
- **Modular Domain-Driven Design (DDD):** Organized around discrete domains (e.g., identity, generation, curriculum).

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19, Tailwind CSS v4
- **Database:** PostgreSQL (via Supabase)
- **AI Integration:** `@anthropic-ai/sdk`, `openai`

## Documentation Index
- [Architecture & DDD Structure](./architecture.md)
- [Getting Started Guide](./getting-started.md)
- [Database & Schema details](./database.md)
- [API Reference](./api-reference.md)
- [AI Integration Details](./ai-integration.md)