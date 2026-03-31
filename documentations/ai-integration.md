# AI Integration

The system leverages Large Language Models via [OpenRouter](https://openrouter.ai) to act as a dynamic educational tutor.

## Architecture: OpenRouter BYOK

All AI requests are routed through **OpenRouter**, a unified API gateway that provides access to many models from a single endpoint. The integration follows a **Bring Your Own Key (BYOK)** model:

1. **User key (preferred):** If the user has added their own OpenRouter API key in the Settings page, it is used for all requests. This allows access to premium/paid models and avoids rate limits on the shared admin key.
2. **Admin key (fallback):** If no user key is set, the server-side `OPENROUTER_API_KEY` environment variable is used. This is the admin/operator key and is intended for free-tier usage only.

## Default Free Models

When no user key is present, the following free models are available by default:

| Model | OpenRouter ID |
|---|---|
| Llama 4 Scout | `meta-llama/llama-4-scout:free` |
| Gemini 2.0 Flash | `google/gemini-2.0-flash-exp:free` |
| DeepSeek R1 | `deepseek/deepseek-r1:free` |
| Mistral 7B | `mistralai/mistral-7b-instruct:free` |

## OpenRouterProvider

The `OpenRouterProvider` class (in `modules/generation/`) implements the `AIProvider` interface and handles all communication with the OpenRouter API. It:

- Accepts either a user-supplied key or falls back to the admin key.
- Sets the `HTTP-Referer` header to `NEXT_PUBLIC_APP_URL` as required by OpenRouter.
- Supports streaming responses for lesson generation and ask interactions.

## Model Options (Admin-Curated)

The list of available model options is curated by the admin via the `prompt_templates` database table (using the `models` slug). The frontend fetches this list from the `/api/models` endpoint on load. This allows the admin to add, remove, or update available models without a code deployment.

## Prompt Templates (`modules/prompt-templates/`)

Prompts are decoupled from the core application logic to allow iterative tuning:
- **Database Storage:** Stored in the `prompt_templates` table via a `slug` (e.g., `lesson`, `ask`, `models`).
- **Customization:** The system looks for an active `user_id` override. If present, it utilizes the personalized prompt. Otherwise, it falls back to the system default template.
- **In-Memory Caching:** The `templates.ts` library uses an in-memory `Map` (with a 5-minute TTL) to heavily cache template fetches, avoiding a database round-trip per generation request.

## Content Caching Strategy

To reduce latency and API costs:
1. When a user requests a lesson, the backend (`/api/generate-lesson`) intercepts the request.
2. It queries the Supabase `lessons` table using the `topic_id` and `model_provider`.
3. If an entry is found, the cached string is instantly returned.
4. If not found, the prompt is injected into the AI Provider logic. The response is yielded, instantly written to the `lessons` table, and subsequently returned to the client.
