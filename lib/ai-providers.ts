import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ModelProvider } from '@/types';

const LESSON_SYSTEM_PROMPT = `You are an expert system design instructor at a FAANG company teaching a senior software engineer who is a visual learner preparing for system design interviews. Write a comprehensive, deeply detailed lesson.

CRITICAL RULES:
- Write COMPLETE content — do NOT truncate. Every section must be fully written.
- Use rich visual HTML structure — NOT solid paragraphs. Break content into scannable, visual blocks.
- Never write walls of text. Use the visual components below liberally.

AVAILABLE HTML COMPONENTS (use these throughout the lesson):

Callout boxes (use for key insights, warnings, tips):
<div class="callout callout-blue"><div class="callout-title">💡 KEY INSIGHT</div><p>text</p></div>
<div class="callout callout-green"><div class="callout-title">✅ BEST PRACTICE</div><p>text</p></div>
<div class="callout callout-gold"><div class="callout-title">⚡ INTERVIEW TIP</div><p>text</p></div>
<div class="callout callout-red"><div class="callout-title">🔴 COMMON MISTAKE</div><p>text</p></div>
<div class="callout callout-purple"><div class="callout-title">🧠 THEORY NOTE</div><p>text</p></div>
<div class="callout callout-cyan"><div class="callout-title">📊 REAL NUMBERS</div><p>text</p></div>

Stat cards grid (for metrics and numbers):
<div class="stat-grid">
  <div class="stat-card"><span class="stat-val">99ms</span><span class="stat-label">Redis p99 latency</span></div>
  <div class="stat-card"><span class="stat-val">10M/s</span><span class="stat-label">Kafka throughput</span></div>
</div>

Theory box (for algorithms, internals, how-it-works):
<div class="theory-box">
  <div class="theory-title">🔬 HOW IT WORKS INTERNALLY</div>
  <ol class="step-list"><li>Step one explanation</li><li>Step two explanation</li></ol>
</div>

Comparison grid (for A vs B decisions):
<div class="compare-grid">
  <div class="compare-card"><div class="compare-title" style="color:#00D68F">✅ USE WHEN</div><ul><li>condition 1</li></ul></div>
  <div class="compare-card"><div class="compare-title" style="color:#FF5470">❌ AVOID WHEN</div><ul><li>condition 1</li></ul></div>
</div>

Tip / Warning boxes:
<div class="tip-box"><div class="tip-icon">💡</div><p>tip text</p></div>
<div class="warn-box"><div class="warn-icon">⚠️</div><p>warning text</p></div>

Tables (for tradeoff comparisons):
<table><thead><tr><th>Option</th><th>Latency</th><th>Tradeoff</th></tr></thead><tbody><tr><td>Redis</td><td>&lt;1ms</td><td>In-memory only</td></tr></tbody></table>

Numbered step list:
<ol class="step-list"><li>First step</li><li>Second step</li></ol>

FORMAT STRUCTURE:
<h2>🎯 What Is It & Why It Matters</h2>
<p>2-3 sentences introducing the concept with a real-world analogy.</p>
<div class="callout callout-blue">...</div>

<h2>🧠 Theory Deep Dive</h2>
<h3>[Core Concept 1]</h3>
<div class="theory-box">...</div>
<p>Explanation text — keep paragraphs SHORT (2-3 sentences max).</p>
<div class="callout callout-purple">...</div>

<h2>📊 Scale & Numbers to Know</h2>
<div class="stat-grid">...[4-6 stat cards with REAL numbers]...</div>
<div class="callout callout-cyan">...</div>

<h2>🏭 How Top Companies Actually Use This</h2>
<h3>Company A</h3><p>Short paragraph. Then a callout or tip box.</p>
<h3>Company B</h3><p>Short paragraph.</p>

<h2>⚖️ Tradeoffs — When To Use What</h2>
<div class="compare-grid">...</div>
<table>[comparison table]</table>

<h2>🔴 Common Failure Modes</h2>
<div class="warn-box">...</div>

<h2>🎤 Interview Playbook</h2>
<div class="callout callout-gold">...</div>
<ol class="step-list">[steps to follow in interview]</ol>

Write with the depth of a senior staff engineer. Use real product names, real numbers, real failure stories. NEVER write placeholder text. Complete every section fully.`;

export async function generateLesson(
  provider: ModelProvider,
  topicTitle: string,
  keyPoints: string[]
): Promise<string> {
  const userMessage = `Teach me about: ${topicTitle}\n\nContext from curriculum:\n${keyPoints.map(k => `- ${k}`).join('\n')}\n\nWrite a complete, comprehensive lesson covering all sections. Do not cut off or summarize — write everything in full.`;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: LESSON_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : 'Unable to generate content.';
  }

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: LESSON_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? 'Unable to generate content.';
  }

  throw new Error(`Unknown provider: ${provider}`);
}

const ASK_SYSTEM_TEMPLATE = (topicTitle: string) =>
  `You are an expert system design instructor. The student is a senior software engineer studying "${topicTitle}". Answer their question clearly and practically. Use concrete examples, real numbers, and reference actual systems where relevant. Format with HTML: <p>, <strong>, <ul><li> as needed. Be direct — no padding. Always write complete answers — never truncate.`;

export async function generateAskResponse(
  provider: ModelProvider,
  topicTitle: string,
  question: string
): Promise<string> {
  const systemPrompt = ASK_SYSTEM_TEMPLATE(topicTitle);

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : 'Unable to get response.';
  }

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    });
    return response.choices[0]?.message?.content ?? 'Unable to get response.';
  }

  throw new Error(`Unknown provider: ${provider}`);
}

const DIAGRAM_SYSTEM_PROMPT = `You are an expert system design architect. Generate a visual architecture diagram as JSON.

Given a description of a system or architecture, output ONLY a valid JSON object with this exact structure:
{
  "title": "Descriptive diagram title",
  "nodes": [
    {
      "id": "unique_snake_case_id",
      "label": "Display Label",
      "sublabel": "optional small text",
      "shape": "rect",
      "color": "#4F9DFF",
      "x": 100,
      "y": 100,
      "width": 140,
      "height": 50
    }
  ],
  "edges": [
    {
      "from": "source_node_id",
      "to": "target_node_id",
      "label": "optional edge label",
      "dashed": false
    }
  ]
}

SHAPE GUIDE:
- "rect" → services, APIs, servers, components (default)
- "cylinder" → databases, storage (DB, Redis, S3) — use height: 70
- "diamond" → load balancers, routers, gateways
- "circle" → users, clients, external services

COLOR PALETTE (use exactly):
- #4F9DFF → blue: services, APIs, application layers
- #00D68F → green: CDN, cache, success paths
- #FF8C42 → orange: load balancers, gateways, middleware
- #9B7FFF → purple: queues, async workers, background jobs
- #00D4FF → cyan: databases, storage
- #FF5470 → red: external services, user clients

LAYOUT RULES:
- Use x: 50–850, y: 50–550 coordinate space
- Default node: width=140, height=50; cylinder: height=70
- At least 170px horizontal gap, 80px vertical gap between nodes
- Flow left→right or top→bottom; users/clients on left, databases on right/bottom
- Max 12 nodes

OUTPUT: ONLY the JSON object. No markdown. No explanation. No code fences.`;

export async function generateDiagram(
  provider: ModelProvider,
  prompt: string
): Promise<string> {
  const userMessage = `Generate an architecture diagram for: ${prompt}`;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: DIAGRAM_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = response.content.find(c => c.type === 'text');
    return block?.type === 'text' ? block.text : '{}';
  }

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: DIAGRAM_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? '{}';
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export const MODEL_OPTIONS = [
  {
    id: 'anthropic' as ModelProvider,
    name: 'Claude Sonnet',
    model: 'claude-sonnet-4-20250514',
    description: 'Anthropic — Best for nuanced explanations',
    color: '#FF8C42',
  },
  {
    id: 'openai' as ModelProvider,
    name: 'GPT-4o',
    model: 'gpt-4o',
    description: 'OpenAI — Strong technical content',
    color: '#10A37F',
  },
];
