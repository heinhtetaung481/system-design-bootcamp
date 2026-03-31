'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Topic } from '@/modules/curriculum/types';
import type { ModelProvider } from '@/modules/prompt-templates/types';
import { DIAGRAMS } from '@/modules/curriculum/lib/diagrams';

interface LearnTabProps {
  topic: Topic;
  provider: ModelProvider;
  completed: boolean;
  onComplete: () => void;
  isMobile: boolean;
}

export default function LearnTab({ topic, provider, completed, onComplete, isMobile }: LearnTabProps) {
  const [lessonContent, setLessonContent] = useState('');
  const [loading,       setLoading]       = useState(false);
  const [isCached,      setIsCached]      = useState(false);
  const [error,         setError]         = useState('');

  const DiagramComp = topic.diagramId ? DIAGRAMS[topic.diagramId] : null;

  const fetchLesson = useCallback(async (forceRegenerate = false) => {
    setLoading(true);
    setError('');
    if (forceRegenerate) setLessonContent('');
    try {
      const res  = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id, topicTitle: topic.title, keyPoints: topic.keyPoints, provider, forceRegenerate }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLessonContent(data.content);
      setIsCached(data.cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
    }
    setLoading(false);
  }, [topic.id, topic.title, topic.keyPoints, provider]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Key Points */}
      <section>
        <Label>Key Points</Label>
        <Card>
          {topic.keyPoints.map((kp, i) => (
            <div
              key={i}
              style={{
                display: 'flex', gap: 14, padding: '12px 0',
                borderBottom: i < topic.keyPoints.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: '#0a84ff', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginTop: 2, width: 14, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(245,245,247,0.78)', lineHeight: 1.65 }}>{kp}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* Diagram */}
      {DiagramComp && (
        <section>
          <Label>Architecture Diagram</Label>
          <Card style={{ overflowX: 'auto' }}>
            <DiagramComp />
          </Card>
        </section>
      )}

      {/* Lesson */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Label style={{ marginBottom: 0 }}>Lesson</Label>
            {isCached && !loading && (
              <span style={{
                fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20,
                background: 'rgba(48,209,88,0.12)', color: '#30d158',
                border: '1px solid rgba(48,209,88,0.20)',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                cached
              </span>
            )}
          </div>
          <button
            onClick={() => fetchLesson(true)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.10)',
              fontSize: 12, fontWeight: 500,
              color: loading ? 'rgba(245,245,247,0.35)' : 'rgba(245,245,247,0.60)',
              background: 'rgba(255,255,255,0.05)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 11, height: 11, border: '1.5px solid #0a84ff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Generating…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6A4 4 0 1 1 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 2v4H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Regenerate
              </>
            )}
          </button>
        </div>

        <Card>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 16 }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#0a84ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 14, color: 'rgba(245,245,247,0.40)' }}>Generating lesson…</span>
              <span style={{ fontSize: 12, color: 'rgba(245,245,247,0.22)', fontFamily: 'JetBrains Mono, monospace' }}>Usually takes 15–30 seconds</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#ff453a', textAlign: 'center', maxWidth: 360 }}>{error}</span>
              <button
                onClick={() => fetchLesson()}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,69,58,0.30)', background: 'rgba(255,69,58,0.10)', color: '#ff453a', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="prose" dangerouslySetInnerHTML={{ __html: lessonContent }} />
          )}
        </Card>
      </section>

      {isMobile && !completed && (
        <button
          onClick={onComplete}
          style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#30d158', color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
        >
          Mark as Complete
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,245,247,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px', ...style }}>
      {children}
    </div>
  );
}
