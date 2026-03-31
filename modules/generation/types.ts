// Re-export ModelProvider from its canonical home (prompt-templates is lower in hierarchy)
export type { ModelProvider, ModelOption } from '@/modules/prompt-templates/types';

export interface Lesson {
  id: string;
  topic_id: string;
  model_provider: string;
  content: string;
  created_at: string;
}

/** Result returned by any AI generation provider */
export interface GenerationResult {
  content: string;
}

/** Strategy interface for AI providers */
export interface AIProvider {
  generateLesson(systemPrompt: string, userMessage: string): Promise<string>;
  generateAskResponse(systemPrompt: string, question: string): Promise<string>;
  generateDiagram(systemPrompt: string, userMessage: string): Promise<string>;
}
