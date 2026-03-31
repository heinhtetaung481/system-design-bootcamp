import type { AIProvider } from '@/modules/generation/types';
import { OpenRouterProvider } from './openrouter';

// No caching here since each call may have different apiKey (user vs admin)
export function getProvider(modelId: string, apiKey: string): AIProvider {
  return new OpenRouterProvider(modelId, apiKey);
}
