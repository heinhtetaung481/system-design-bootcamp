'use client';

import { Topic } from '@/types';
import { DIAGRAMS } from './diagrams';

export default function DiagramTab({ topic }: { topic: Topic }) {
  const DiagramComp = topic.diagramId ? DIAGRAMS[topic.diagramId] : null;

  const card: React.CSSProperties = {
    background: '#1c1c1e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  };

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(245,245,247,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 8,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {DiagramComp ? (
        <>
          <section>
            <div style={label}>Architecture Diagram</div>
            <div style={{ ...card, padding: 20, overflowX: 'auto' }}>
              <DiagramComp />
            </div>
          </section>

          <section>
            <div style={label}>Drawing Guide</div>
            <div style={{ ...card, padding: 20 }}>
              <p style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
                Open{' '}
                <a
                  href="https://excalidraw.com"
                  target="_blank"
                  rel="noopener"
                  style={{ color: '#0a84ff', textDecoration: 'none' }}
                >
                  excalidraw.com
                </a>
                {' '}and recreate this diagram from memory. Use each point below as a component:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topic.keyPoints.map((kp, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#0a84ff', flexShrink: 0, marginTop: 1, fontSize: 14 }}>→</span>
                    <span style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.65)', lineHeight: 1.65 }}>{kp}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <div style={{ ...card, padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6 }}>✏️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8, letterSpacing: '-0.01em' }}>
            Draw this in Excalidraw
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.45)', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.7 }}>
            For this topic, design the architecture from scratch. Drawing it yourself builds far deeper understanding than viewing a pre-built diagram.
          </p>
          <a
            href="https://excalidraw.com"
            target="_blank"
            rel="noopener"
            style={{
              fontSize: 13, fontWeight: 500, color: '#0a84ff',
              textDecoration: 'none', padding: '8px 18px',
              border: '1px solid rgba(10,132,255,0.30)',
              borderRadius: 8, background: 'rgba(10,132,255,0.08)',
              display: 'inline-block',
            }}
          >
            Open excalidraw.com →
          </a>
        </div>
      )}
    </div>
  );
}
