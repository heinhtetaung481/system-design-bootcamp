'use client';

import { useState } from 'react';
import { CURRICULUM } from '@/lib/curriculum';

interface SidebarProps {
  currentId: string;
  completed: Set<string>;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const totalTopics = CURRICULUM.reduce(
  (acc, p) => acc + p.weeks.reduce((a, w) => a + w.topics.length, 0),
  0
);

export default function Sidebar({ currentId, completed, onSelect, isOpen, onClose, isMobile }: SidebarProps) {
  const completedCount = completed.size;
  const progress = Math.round((completedCount / totalTopics) * 100);

  const currentPhaseIdx = CURRICULUM.findIndex(p =>
    p.weeks.some(w => w.topics.some(t => t.id === currentId))
  );

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set([currentPhaseIdx >= 0 ? currentPhaseIdx : 0])
  );

  const togglePhase = (idx: number) => {
    setExpandedPhases(prev => {
      const n = new Set(prev);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 z-20"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`flex flex-col flex-shrink-0 overflow-hidden ${isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'}`}
        style={{
          width: 240,
          height: '100vh',
          background: 'rgba(7,7,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#ededf5',
                letterSpacing: '-0.03em',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                System Design
              </div>
              <div style={{ fontSize: 11, color: 'rgba(237,237,245,0.38)', marginTop: 2, letterSpacing: '0.02em' }}>
                Interview Bootcamp
              </div>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                style={{
                  color: 'rgba(237,237,245,0.38)',
                  padding: 4,
                  marginTop: -2,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'color 0.15s',
                }}
                className="hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: 'rgba(237,237,245,0.35)', letterSpacing: '0.02em' }}>Progress</span>
              <span style={{ fontSize: 11, color: 'rgba(237,237,245,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                {completedCount} / {totalTopics}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 10,
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4f8ef7, #818cf8)',
                transition: 'width 0.6s ease',
                boxShadow: progress > 0 ? '0 0 8px rgba(79,142,247,0.5)' : 'none',
              }} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '8px 8px' }}>
          {CURRICULUM.map((phase, phaseIdx) => {
            const isExpanded = expandedPhases.has(phaseIdx);
            const phaseTopics = phase.weeks.flatMap(w => w.topics);
            const phaseDone = phaseTopics.filter(t => completed.has(t.id)).length;

            return (
              <div key={phase.phase} style={{ marginBottom: 3 }}>

                {/* Phase row */}
                <button
                  onClick={() => togglePhase(phaseIdx)}
                  className="w-full flex items-center gap-2 rounded-lg transition-colors"
                  style={{ padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13 }}>{phase.phaseEmoji}</span>
                  <span
                    className="flex-1 text-left truncate"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(237,237,245,0.45)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {phase.phaseTitle}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(237,237,245,0.22)', flexShrink: 0 }}>
                    {phaseDone}/{phaseTopics.length}
                  </span>
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    style={{
                      color: 'rgba(237,237,245,0.22)',
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <path d="M1.5 3.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Topics */}
                {isExpanded && (
                  <div className="animate-slideDown" style={{ paddingLeft: 4 }}>
                    {phase.weeks.map(week =>
                      week.topics.map(topic => {
                        const active = topic.id === currentId;
                        const done = completed.has(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => { onSelect(topic.id); if (isMobile) onClose(); }}
                            className="w-full flex items-center gap-2.5 rounded-lg transition-all"
                            style={{
                              padding: '6px 8px',
                              marginBottom: 1,
                              background: active
                                ? 'linear-gradient(135deg, rgba(79,142,247,0.22), rgba(129,140,248,0.16))'
                                : 'transparent',
                              border: active
                                ? '1px solid rgba(79,142,247,0.30)'
                                : '1px solid transparent',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{topic.emoji}</span>
                            <span
                              className="flex-1 truncate text-left"
                              style={{
                                fontSize: 13,
                                fontWeight: active ? 500 : 400,
                                color: active ? '#ededf5' : done ? 'rgba(237,237,245,0.36)' : 'rgba(237,237,245,0.75)',
                                lineHeight: 1.3,
                              }}
                            >
                              {topic.title}
                            </span>
                            {done && !active && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                                <circle cx="6" cy="6" r="5.5" stroke="#34d399" strokeWidth="1"/>
                                <path d="M3.5 6l2 2 3-3" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
