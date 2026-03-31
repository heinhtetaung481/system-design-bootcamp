'use client';

import { useState } from 'react';
import type { Topic } from '@/modules/curriculum/types';
export default function AskTab({ topic, modelId }: { topic: Topic; modelId: string }) {
  const [question, setQuestion] = useState('');
  const [answer,   setAnswer]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const SUGGESTED = [
    `What's the most common mistake engineers make designing ${topic.title.toLowerCase()}?`,
    `How does ${topic.title.toLowerCase()} work at Google or Meta scale?`,
    `What tradeoffs should I explicitly state in an interview?`,
    `Give me a real production failure example and how it was resolved.`,
  ];

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true); setError(''); setAnswer('');
    try {
      const res  = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, topicTitle: topic.title, question, modelId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get response');
    }
    setLoading(false);
  };

  const card: React.CSSProperties = {
    background: '#1c1c1e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Input */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>
            Ask about {topic.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(245,245,247,0.40)', marginTop: 4 }}>
            Get production-level insights from your AI instructor.
          </div>
        </div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk(); }}
          placeholder={`e.g. "How does ${topic.title.toLowerCase()} work at Netflix scale?"`}
          rows={3}
          style={{
            width: '100%',
            background: '#000',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            color: '#f5f5f7',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'Inter, -apple-system, sans-serif',
            lineHeight: 1.6,
            transition: 'border-color 0.15s',
          }}
          onFocus={e  => { e.currentTarget.style.borderColor = '#0a84ff'; }}
          onBlur={e   => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.28)', fontFamily: 'JetBrains Mono, monospace' }}>
            ⌘ Return to send
          </span>
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: question.trim() && !loading ? '#0a84ff' : 'rgba(10,132,255,0.25)',
              color: '#ffffff',
              fontSize: 13.5, fontWeight: 500,
              cursor: question.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 12, height: 12, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Thinking…
              </>
            ) : 'Send'}
          </button>
        </div>
      </div>

      {/* Answer */}
      {(loading || answer || error) && (
        <div style={{ ...card, padding: 20 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', gap: 14 }}>
              <div style={{ width: 26, height: 26, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#0a84ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 14, color: 'rgba(245,245,247,0.40)' }}>Thinking…</span>
            </div>
          ) : error ? (
            <div style={{ fontSize: 14, color: '#ff453a' }}>{error}</div>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Response
              </div>
              <div className="prose" dangerouslySetInnerHTML={{ __html: answer }} />
            </>
          )}
        </div>
      )}

      {/* Suggested */}
      <div style={{ ...card, padding: '4px 0' }}>
        <div style={{ padding: '12px 20px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(245,245,247,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Suggested Questions
        </div>
        {SUGGESTED.map((sq, i) => (
          <button
            key={i}
            onClick={() => setQuestion(sq)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '11px 20px',
              fontSize: 13.5, color: '#0a84ff',
              background: 'transparent', border: 'none',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
              lineHeight: 1.5,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(10,132,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {sq}
          </button>
        ))}
        <div style={{ height: 4 }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
