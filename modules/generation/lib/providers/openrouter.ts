import type { AIProvider } from '@/modules/generation/types';

export class OpenRouterProvider implements AIProvider {
  private modelId: string;
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(modelId: string, apiKey: string) {
    this.modelId = modelId;
    this.apiKey = apiKey;
  }

  private async chat(systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'System Design Bootcamp',
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices[0]?.message?.content ?? '';
  }

  async generateLesson(systemPrompt: string, userMessage: string): Promise<string> {
    return this.chat(systemPrompt, userMessage, 4000);
  }

  async generateAskResponse(systemPrompt: string, question: string): Promise<string> {
    return this.chat(systemPrompt, question, 2000);
  }

  async generateDiagram(systemPrompt: string, userMessage: string): Promise<string> {
    return this.chat(systemPrompt, userMessage, 2000);
  }
}
