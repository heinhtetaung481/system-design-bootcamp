# AI Integration

The system leverages Large Language Models to act as a dynamic educational tutor.

## Supported Providers
- **OpenAI:** Uses the `openai` SDK (`gpt-4o` or similar).
- **Anthropic:** Uses the `@anthropic-ai/sdk` (`claude-3-7-sonnet` or similar).

## Architecture (`modules/generation/`)
The `generation` module abstracts the complexities of the LLM SDKs through a Provider interface:
- **`AIProvider` Interface:** Defines methods like `generateLesson(systemPrompt, userMessage)` and `generateAskResponse(systemPrompt, question)`.
- **Implementations:** `OpenAIProvider` and `AnthropicProvider` implement this interface.
- **Factory (`factory.ts`):** Returns the appropriate provider instance based on user selection or defaults.

## Prompt Templates (`modules/prompt-templates/`)
Prompts are decoupled from the core application logic to allow iterative tuning:
- **Database Storage:** Stored in the `prompt_templates` table via a `slug` (e.g., `lesson`, `ask`).
- **Customization:** The system looks for an active `user_id` override. If present, it utilizes the personalized prompt. Otherwise, it falls back to the system default template.
- **In-Memory Caching:** The `templates.ts` library uses an in-memory `Map` (with a 5-minute TTL) to heavily cache template fetches, avoiding a database round-trip per generation request.

## Content Caching Strategy
To reduce latency and API costs:
1. When a user requests a lesson, the backend (`/api/generate-lesson`) intercepts the request.
2. It queries the Supabase `lessons` table using the `topic_id` and `model_provider`.
3. If an entry is found, the cached string is instantly returned.
4. If not found, the prompt is injected into the AI Provider logic. The response is yielded, instantly written to the `lessons` table, and subsequently returned to the client.