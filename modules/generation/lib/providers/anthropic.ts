import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from '@/modules/generation/types';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateLesson(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : 'Unable to generate content.';
  }

  async generateAskResponse(systemPrompt: string, question: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : 'Unable to get response.';
  }

  async generateDiagram(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : '{}';
  }
}
