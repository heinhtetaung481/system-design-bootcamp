# API Reference

The Next.js App Router API endpoints are located in the `app/api/` directory.

### `POST /api/generate-lesson`
- **Purpose:** Generates system design lesson content based on a topic.
- **Body payload:** `{ topicId, topicTitle, keyPoints, provider, forceRegenerate }`
- **Behavior:** Checks the `lessons` database table. If a generated lesson exists (and `forceRegenerate` is false), it returns the cached content. Otherwise, invokes the `generation` module using the requested provider (Anthropic/OpenAI), caches the result, and returns it.

### `POST /api/generate-diagram`
- **Purpose:** Connects to an AI provider to generate a structured system architecture diagram for a given topic.
- **Behavior:** Operates similarly to lesson generation, parsing AI output into a diagram-friendly format.

### `POST /api/ask`
- **Purpose:** Handles Q&A for specific system design topics.
- **Body payload:** `{ topicId, topicTitle, question, provider }`
- **Behavior:** Prompts the selected AI model to answer the `question` based on the `topicTitle`. Employs a "best effort" insert into the `ask_responses` Supabase table.

### `GET/POST /api/progress`
- **Purpose:** Retrieves or updates the user's progress through the system design curriculum.
- **Behavior:** Interacts with the `user_progress` table to persist session/user data.

### `GET/POST /api/curriculum`
- **Purpose:** Fetches the active curriculum structure (topics, phases) from the `curriculum_versions` table.

### `GET/POST /api/diagrams`
- **Purpose:** Endpoint for fetching specific or cached diagram data.

### `GET/POST /api/user-settings`
- **Purpose:** Updates or fetches preferences for the user (e.g., preferred model provider, custom prompt template overrides).