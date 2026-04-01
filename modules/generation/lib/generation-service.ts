import { getTemplate } from '@/modules/prompt-templates';
import { getProvider } from './providers/factory';

async function getLessonPrompt(): Promise<string> {
  return getTemplate('lesson');
}

async function getAskPrompt(topicTitle: string): Promise<string> {
  const template = await getTemplate('ask');
  return template.replace('{{topicTitle}}', topicTitle);
}

async function getDiagramPrompt(): Promise<string> {
  return getTemplate('diagram');
}

export async function generateLesson(
  modelId: string,
  apiKey: string,
  topicTitle: string,
  keyPoints: string[]
): Promise<string> {
  const systemPrompt = await getLessonPrompt();
  const userMessage = `Teach me about: ${topicTitle}\n\nContext from curriculum:\n${keyPoints.map(k => `- ${k}`).join('\n')}\n\nWrite a complete, comprehensive lesson covering all sections. Do not cut off or summarize — write everything in full.`;
  const provider = getProvider(modelId, apiKey);
  return provider.generateLesson(systemPrompt, userMessage);
}

export async function generateAskResponse(
  modelId: string,
  apiKey: string,
  topicTitle: string,
  question: string
): Promise<string> {
  const systemPrompt = await getAskPrompt(topicTitle);
  const provider = getProvider(modelId, apiKey);
  return provider.generateAskResponse(systemPrompt, question);
}

export async function generateDiagram(
  modelId: string,
  apiKey: string,
  prompt: string
): Promise<string> {
  const systemPrompt = await getDiagramPrompt();
  const userMessage = `Generate an architecture diagram for: ${prompt}`;
  const provider = getProvider(modelId, apiKey);
  return provider.generateDiagram(systemPrompt, userMessage);
}
