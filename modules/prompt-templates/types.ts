export type ModelProvider = string;

export type TemplateSlug = 'lesson' | 'ask' | 'diagram' | 'models';

export interface PromptTemplate {
  id: string;
  slug: TemplateSlug;
  title: string;
  content: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  color: string;
}
