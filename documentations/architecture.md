# Architecture

The System Design Bootcamp application employs a modern, full-stack architecture heavily focused on modularity and clear separation of concerns using Domain-Driven Design (DDD) principles.

## Tech Stack
- **Frontend / Backend Framework:** Next.js 16 (App Router) with React 19.
- **Styling:** Tailwind CSS 4.
- **Database / Auth:** Supabase (PostgreSQL).
- **AI Services:** Anthropic & OpenAI via their official SDKs.

## Domain-Driven Design (DDD) Module Structure

The application is structured into two main architectural divisions to keep domain logic isolated from presentation layers:

### `modules/` Directory (Domain Logic)
This directory contains core business logic, categorized by bounded contexts (domains). Each module is encapsulated and exports only what is necessary via an `index.ts`.
- `identity/`: Handles user authentication, Supabase client initialization (browser/server), and user settings.
- `generation/`: Contains the logic for integrating with AI providers (OpenAI, Anthropic). Implements a `Factory` pattern to select the right AI provider.
- `curriculum/`: Manages the reading and organization of system design lessons/topics.
- `progress/` & `user-courses/`: Manages tracking and recording user progression through the curriculum.
- `prompt-templates/`: Manages the prompt templates used for AI model requests, supporting caching and per-user overrides.
- `analytics/`: Logic for tracking analytics data.

### `components/` Directory (Presentation Layer)
This directory houses the React components responsible for the UI, consuming hooks and utility functions from the `modules/` directory.
- UI components are grouped here (e.g., `Sidebar.tsx`, `LearnTab.tsx`, `AskTab.tsx`, `DiagramTab.tsx`, `PracticeTab.tsx`).

This strict separation ensures that business logic can be independently tested, scaled, and swapped (e.g., switching AI providers) without breaking the user interface.