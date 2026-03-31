'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Phase, Topic } from '@/modules/curriculum/types';
import { createClient } from '@/modules/identity/lib/supabase-browser';
import Sidebar from '@/components/Sidebar';
import LearnTab from '@/components/LearnTab';
import DiagramTab from '@/components/DiagramTab';
import PracticeTab from '@/components/PracticeTab';
import AskTab from '@/components/AskTab';
import ModelSelector from '@/components/ModelSelector';

type Tab = 'learn' | 'diagram' | 'practice' | 'ask';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'learn',    label: 'Learn',    emoji: '📖' },
  { id: 'diagram',  label: 'Diagram',  emoji: '🗺️' },
  { id: 'practice', label: 'Practice', emoji: '📝' },
  { id: 'ask',      label: 'Ask AI',   emoji: '💬' },
];

export default function Home() {
  type EnrichedTopic = Topic & { phaseTitle: string; phaseColor: string; weekTitle: string };

  const router = useRouter();
  const [currentId,   setCurrentId]   = useState('networking');
  const [activeTab,   setActiveTab]   = useState<Tab>('learn');
  const [completed,   setCompleted]   = useState<Set<string>>(new Set());
  const [modelId,     setModelId]     = useState<string>('meta-llama/llama-4-scout:free');
  const [modelOptions, setModelOptions] = useState<import('@/modules/prompt-templates/types').ModelOption[]>([]);
  const [hasOwnKey,   setHasOwnKey]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);
  const [userAvatar,  setUserAvatar]  = useState<string | null>(null);
  const [userName,    setUserName]    = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // DB-backed curriculum
  const [curriculum, setCurriculum] = useState<Phase[]>([]);
  const [allTopics, setAllTopics] = useState<EnrichedTopic[]>([]);

  useEffect(() => {
    fetch('/api/curriculum')
      .then(res => res.json())
      .then(data => {
        setCurriculum(data.curriculum || []);
        setAllTopics(data.allTopics || []);
      })
      .catch(() => { /* will show empty state briefly */ });
  }, []);

  useEffect(() => {
    if (window.location.search.includes('code=')) {
      window.history.replaceState({}, '', '/');
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.user_name || user.email || null);
      }
    });

    fetch('/api/user-settings')
      .then(async res => {
        if (!res.ok) { setSettingsLoading(false); return; }
        const data = await res.json();
        if (data.hasOwnKey) setHasOwnKey(data.hasOwnKey);
        if (data.selectedModel) {
          setModelId(data.selectedModel);
          setSettingsLoading(false);
        } else {
          setSettingsLoading(false);
          router.push('/settings?setup=true');
        }
      })
      .catch(() => { setSettingsLoading(false); });
  }, [router]);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.options?.length) setModelOptions(data.options);
      })
      .catch(() => { /* use fallback from ModelSelector */ });
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load progress from DB
  useEffect(() => {
    fetch('/api/progress')
      .then(res => res.json())
      .then(data => {
        if (data.completedTopics) setCompleted(new Set(data.completedTopics));
      })
      .catch(() => { /* ignore */ });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const markComplete = () => {
    const n = new Set(completed);
    n.add(currentId);
    setCompleted(n);
    // Persist to DB
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: currentId }),
    }).catch(() => { /* ignore */ });
  };

  const handleTopicSelect = (id: string) => {
    setCurrentId(id);
    setActiveTab('learn');
    if (isMobile) setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const topic      = allTopics.find(t => t.id === currentId) || null;
  const isComplete = completed.has(currentId);
  const idx        = allTopics.findIndex(t => t.id === currentId);
  const prevTopic  = idx > 0 ? allTopics[idx - 1] : null;
  const nextTopic  = idx < allTopics.length - 1 ? allTopics[idx + 1] : null;

  if (settingsLoading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(237,237,245,0.30)', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

      <Sidebar
        currentId={currentId}
        completed={completed}
        onSelect={handleTopicSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        curriculum={curriculum}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* ── Glass Toolbar ── */}
        <header style={{
          flexShrink: 0,
          background: 'rgba(7,7,15,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.09)',
          position: 'relative',
          zIndex: 10,
        }}>

          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 52 }}>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                color: 'rgba(237,237,245,0.40)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                e.currentTarget.style.color = '#ededf5';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = 'rgba(237,237,245,0.40)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4"    width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>

            {/* Topic info */}
            {topic && (
              <>
                <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{topic.emoji}</span>
                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: '#ededf5',
                  letterSpacing: '-0.02em',
                  fontFamily: "'Space Grotesk', sans-serif",
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {topic.title}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  padding: '2px 9px', borderRadius: 20,
                  background: 'rgba(79,142,247,0.12)',
                  border: '1px solid rgba(79,142,247,0.22)',
                  color: '#4f8ef7',
                  flexShrink: 0,
                  display: isMobile ? 'none' : undefined,
                }}>
                  {topic.difficulty}
                </span>
              </>
            )}

            <div style={{ flex: 1 }} />

            {/* Model selector */}
            {!isMobile && (
              <ModelSelector
                modelId={modelId}
                onChange={setModelId}
                options={modelOptions}
                hasOwnKey={hasOwnKey}
              />
            )}

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

              {/* Prev / Next */}
              {[
                { topic: prevTopic, dir: 'prev', path: 'M8 3L3 8l5 5' },
                { topic: nextTopic, dir: 'next', path: 'M8 3l5 5-5 5' },
              ].map(({ topic: t, dir, path }) => (
                <button
                  key={dir}
                  onClick={() => t && handleTopicSelect(t.id)}
                  disabled={!t}
                  title={t?.title}
                  style={{
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 7,
                    color: t ? 'rgba(237,237,245,0.45)' : 'rgba(237,237,245,0.15)',
                    background: 'transparent',
                    border: '1px solid transparent',
                    cursor: t ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (t) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#ededf5'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = t ? 'rgba(237,237,245,0.45)' : 'rgba(237,237,245,0.15)'; }}
                >
                  <svg width="11" height="16" viewBox="0 0 11 16" fill="none">
                    <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}

              {/* Mark done */}
              {topic && (
                <button
                  onClick={markComplete}
                  disabled={isComplete}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 8,
                    border: isComplete ? '1px solid rgba(52,211,153,0.30)' : '1px solid rgba(255,255,255,0.10)',
                    fontSize: 12, fontWeight: 500,
                    cursor: isComplete ? 'default' : 'pointer',
                    color: isComplete ? '#34d399' : 'rgba(237,237,245,0.65)',
                    background: isComplete ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    transition: 'all 0.15s',
                  }}
                >
                  {isComplete ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" strokeWidth="1"/>
                        <path d="M3 5.5l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Done
                    </>
                  ) : 'Mark done'}
                </button>
              )}

              {/* User avatar + dropdown */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  title={userName ? `Account (${userName})` : 'Account'}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label={userName ? `Account menu for ${userName}` : 'Account menu'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px 3px 3px',
                    borderRadius: 8,
                    color: 'rgba(237,237,245,0.45)',
                    background: userMenuOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: userMenuOpen ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#ededf5'; }}
                  onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(237,237,245,0.45)'; } }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt=""
                      style={{
                        width: 24, height: 24, borderRadius: '50%',
                        border: '1.5px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                  )}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Account options"
                    className="animate-slideDown"
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'rgba(10,10,20,0.92)',
                      backdropFilter: 'blur(28px)',
                      WebkitBackdropFilter: 'blur(28px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      padding: 6,
                      minWidth: 180,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                      zIndex: 100,
                    }}
                  >
                    {userName && (
                      <div style={{
                        padding: '7px 10px 9px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: 4,
                      }}>
                        <div style={{ fontSize: 11, color: 'rgba(237,237,245,0.32)', marginBottom: 2 }}>Signed in as</div>
                        <div style={{ fontSize: 13, color: '#ededf5', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {userName}
                        </div>
                      </div>
                    )}
                    <button
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '7px 10px',
                        borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(237,237,245,0.75)',
                        fontSize: 13, textAlign: 'left', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Settings
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '7px 10px',
                        borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(248,113,113,0.85)',
                        fontSize: 13, textAlign: 'left', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2 — Pill Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px 8px', gap: 3 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '5px 14px',
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#ededf5' : 'rgba(237,237,245,0.42)',
                    background: active ? 'rgba(79,142,247,0.15)' : 'transparent',
                    border: active ? '1px solid rgba(79,142,247,0.28)' : '1px solid transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    letterSpacing: '-0.005em',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(237,237,245,0.70)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(237,237,245,0.42)'; } }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'transparent' }}>
          {topic ? (
            <div
              key={`${currentId}-${activeTab}`}
              className="animate-fadeUp"
              style={{ maxWidth: 740, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 24px 48px' }}
            >
              {activeTab === 'learn'    && <LearnTab    topic={topic} modelId={modelId} completed={isComplete} onComplete={markComplete} isMobile={isMobile} />}
              {activeTab === 'diagram'  && <DiagramTab  topic={topic} modelId={modelId} />}
              {activeTab === 'practice' && <PracticeTab topic={topic} />}
              {activeTab === 'ask'      && <AskTab      topic={topic} modelId={modelId} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(237,237,245,0.25)', fontSize: 14 }}>
              Select a topic to begin
            </div>
          )}
        </main>

        {/* ── Mobile bottom bar ── */}
        {isMobile && topic && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(7,7,15,0.88)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px 6px',
            gap: 4,
            paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
            zIndex: 50,
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 4px',
                  borderRadius: 10,
                  border: activeTab === tab.id ? '1px solid rgba(79,142,247,0.28)' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(79,142,247,0.14)' : 'transparent',
                  color: activeTab === tab.id ? '#4f8ef7' : 'rgba(237,237,245,0.35)',
                  transition: 'all 0.15s',
                  fontSize: 10,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                }}
              >
                <span style={{ fontSize: 18 }}>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
            <button
              onClick={markComplete}
              disabled={isComplete}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 10,
                border: isComplete ? '1px solid rgba(52,211,153,0.30)' : '1px solid rgba(255,255,255,0.10)',
                fontSize: 12, fontWeight: 500,
                cursor: isComplete ? 'default' : 'pointer',
                color: isComplete ? '#34d399' : 'rgba(237,237,245,0.65)',
                background: isComplete ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.06)',
              }}
            >
              {isComplete ? '✓' : 'Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
