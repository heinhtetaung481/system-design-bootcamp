import OpenAI from 'openai';
import type { AIProvider } from '@/modules/generation/types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model = 'gpt-4o';

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateLesson(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? 'Unable to generate content.';
  }

  async generateAskResponse(systemPrompt: string, question: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    });
    return response.choices[0]?.message?.content ?? 'Unable to get response.';
  }

  async generateDiagram(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? '{}';
  }
}
