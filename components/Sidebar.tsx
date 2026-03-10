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
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`flex flex-col flex-shrink-0 overflow-hidden ${isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'}`}
        style={{
          width: 240,
          height: '100vh',
          background: '#1c1c1e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em' }}>
                System Design
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.40)', marginTop: 2 }}>
                Interview Bootcamp
              </div>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                style={{ color: 'rgba(245,245,247,0.40)', padding: 4, marginTop: -2 }}
                className="hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)' }}>Progress</span>
              <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                {completedCount} / {totalTopics}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 10, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 10,
                width: `${progress}%`,
                background: '#0a84ff',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 16px' }} />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '8px 8px' }}>
          {CURRICULUM.map((phase, phaseIdx) => {
            const isExpanded = expandedPhases.has(phaseIdx);
            const phaseTopics = phase.weeks.flatMap(w => w.topics);
            const phaseDone = phaseTopics.filter(t => completed.has(t.id)).length;

            return (
              <div key={phase.phase} style={{ marginBottom: 4 }}>

                {/* Phase row */}
                <button
                  onClick={() => togglePhase(phaseIdx)}
                  className="w-full flex items-center gap-2 rounded-lg transition-colors"
                  style={{ padding: '6px 8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13 }}>{phase.phaseEmoji}</span>
                  <span
                    className="flex-1 text-left truncate"
                    style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.50)', letterSpacing: '0.01em' }}
                  >
                    {phase.phaseTitle}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.25)', flexShrink: 0 }}>
                    {phaseDone}/{phaseTopics.length}
                  </span>
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    style={{
                      color: 'rgba(245,245,247,0.25)',
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
                            className="w-full flex items-center gap-2.5 rounded-lg transition-colors"
                            style={{
                              padding: '6px 8px',
                              marginBottom: 1,
                              background: active ? '#0a84ff' : 'transparent',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{topic.emoji}</span>
                            <span
                              className="flex-1 truncate text-left"
                              style={{
                                fontSize: 13,
                                fontWeight: active ? 500 : 400,
                                color: active ? '#ffffff' : done ? 'rgba(245,245,247,0.38)' : 'rgba(245,245,247,0.78)',
                                lineHeight: 1.3,
                              }}
                            >
                              {topic.title}
                            </span>
                            {done && !active && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                                <circle cx="6" cy="6" r="5.5" stroke="#30d158" strokeWidth="1"/>
                                <path d="M3.5 6l2 2 3-3" stroke="#30d158" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
