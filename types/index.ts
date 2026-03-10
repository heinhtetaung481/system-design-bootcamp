export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type Tag = 'Core' | 'Component' | 'System' | 'Advanced' | 'Review' | 'Interview';

export interface PracticeQuestion {
  q: string;
  h: string;
  a: string;
}

export interface Topic {
  id: string;
  title: string;
  emoji: string;
  difficulty: Difficulty;
  tag: Tag;
  diagramId?: string;
  keyPoints: string[];
  practice: PracticeQuestion[];
}

export interface Week {
  week: number;
  weekTitle: string;
  topics: Topic[];
}

export interface Phase {
  phase: number;
  phaseTitle: string;
  phaseColor: string;
  phaseEmoji: string;
  weeks: Week[];
}

export type ModelProvider = 'anthropic' | 'openai';

export interface ModelOption {
  id: ModelProvider;
  name: string;
  model: string;
  description: string;
  color: string;
}

export interface Lesson {
  id: string;
  topic_id: string;
  model_provider: string;
  content: string;
  created_at: string;
}
