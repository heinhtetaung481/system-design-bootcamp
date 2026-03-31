// Re-export shim — consumers should migrate to @/modules/*/types
export type { Difficulty, Tag, PracticeQuestion, Topic, Week, Phase } from '@/modules/curriculum/types';
export type { ModelProvider } from '@/modules/prompt-templates/types';
export type { ModelOption, Lesson } from '@/modules/generation/types';
