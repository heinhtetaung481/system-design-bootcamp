'use client';

import { useState } from 'react';
import { Topic } from '@/types';

export default function PracticeTab({ topic }: { topic: Topic }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <p style={{ fontSize: 13, color: 'rgba(245,245,247,0.35)', marginBottom: 4 }}>
        {topic.practice.length} practice questions — think through each one before revealing the answer.
      </p>

      {topic.practice.map((pq, i) => {
        const isRevealed = revealed[i];
        return (
          <div
            key={i}
            style={{
              background: '#1c1c1e',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 20 }}>
              {/* Question */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 6,
                  background: 'rgba(10,132,255,0.15)', color: '#0a84ff',
                  fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, marginTop: 1,
                }}>
                  Q{i + 1}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#f5f5f7', lineHeight: 1.6 }}>{pq.q}</span>
              </div>

              {/* Hint */}
              {!isRevealed && (
                <div style={{
                  fontSize: 12.5, color: 'rgba(245,245,247,0.40)',
                  padding: '9px 12px', borderRadius: 8, marginBottom: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  Hint: {pq.h}
                </div>
              )}

              {/* Reveal / Answer */}
              {!isRevealed ? (
                <button
                  onClick={() => setRevealed(r => ({ ...r, [i]: true }))}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(245,245,247,0.65)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#f5f5f7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(245,245,247,0.65)'; }}
                >
                  Reveal Answer
                </button>
              ) : (
                <div
                  className="animate-fadeIn"
                  style={{
                    borderLeft: '2px solid #30d158',
                    paddingLeft: 14,
                    marginTop: 4,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#30d158', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Answer
                  </div>
                  <div style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.78)', lineHeight: 1.7 }}>{pq.a}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Timed Challenge */}
      <div style={{
        background: '#1c1c1e',
        border: '1px solid rgba(255,159,10,0.20)',
        borderRadius: 12,
        padding: 20,
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,159,10,0.12)', color: '#ff9f0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>⏱</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ff9f0a' }}>45-Minute Challenge</span>
        </div>
        <p style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.50)', lineHeight: 1.7, marginBottom: 12 }}>
          Set a timer and design a complete system for this topic from scratch using the Hello Interview framework:
        </p>
        <div style={{
          fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace',
          color: '#0a84ff', background: 'rgba(10,132,255,0.08)',
          border: '1px solid rgba(10,132,255,0.15)',
          borderRadius: 8, padding: '10px 14px', lineHeight: 1.8,
        }}>
          Requirements → Estimation → API Design → Data Model → High-Level Design → Deep Dives → Tradeoffs
        </div>
      </div>
    </div>
  );
}
