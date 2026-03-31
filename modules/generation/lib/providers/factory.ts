import type { ModelProvider } from '@/modules/prompt-templates/types';
import type { AIProvider } from '@/modules/generation/types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

const providerCache = new Map<ModelProvider, AIProvider>();

/** Factory: returns a cached provider instance for the given model provider key. */
export function getProvider(provider: ModelProvider): AIProvider {
  let instance = providerCache.get(provider);
  if (instance) return instance;

  switch (provider) {
    case 'anthropic':
      instance = new AnthropicProvider();
      break;
    case 'openai':
      instance = new OpenAIProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  providerCache.set(provider, instance);
  return instance;
}
