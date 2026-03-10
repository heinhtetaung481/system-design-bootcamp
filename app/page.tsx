'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ModelProvider } from '@/types';
import { getTopicById, getAllTopics } from '@/lib/curriculum';
import { createClient } from '@/lib/supabase-browser';
import Sidebar from '@/components/Sidebar';
import LearnTab from '@/components/LearnTab';
import DiagramTab from '@/components/DiagramTab';
import PracticeTab from '@/components/PracticeTab';
import AskTab from '@/components/AskTab';

type Tab = 'learn' | 'diagram' | 'practice' | 'ask';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'learn',    label: 'Learn',    emoji: '📖' },
  { id: 'diagram',  label: 'Diagram',  emoji: '🗺️' },
  { id: 'practice', label: 'Practice', emoji: '📝' },
  { id: 'ask',      label: 'Ask AI',   emoji: '💬' },
];

export default function Home() {
  const router = useRouter();
  const [currentId,   setCurrentId]   = useState('networking');
  const [activeTab,   setActiveTab]   = useState<Tab>('learn');
  const [completed,   setCompleted]   = useState<Set<string>>(new Set());
  const [provider,    setProvider]    = useState<ModelProvider>('anthropic');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);
  const [userAvatar,  setUserAvatar]  = useState<string | null>(null);
  const [userName,    setUserName]    = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load user info and model setting
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

    // Load model preference from user settings
    fetch('/api/user-settings')
      .then(r => r.json())
      .then(data => {
        if (data.selectedModel) {
          setProvider(data.selectedModel as ModelProvider);
        } else {
          // No model configured — redirect to settings setup
          router.push('/settings?setup=true');
          return;
        }
        setSettingsLoading(false);
      })
      .catch(() => {
        // Fallback: use default provider from env
        setSettingsLoading(false);
      });
  }, [router]);

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sdb_progress');
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveProgress = (s: Set<string>) => {
    try { localStorage.setItem('sdb_progress', JSON.stringify([...s])); } catch { /* ignore */ }
  };

  const markComplete = () => {
    const n = new Set(completed);
    n.add(currentId);
    setCompleted(n);
    saveProgress(n);
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

  const topic      = getTopicById(currentId);
  const isComplete = completed.has(currentId);
  const allTopics  = getAllTopics();
  const idx        = allTopics.findIndex(t => t.id === currentId);
  const prevTopic  = idx > 0 ? allTopics[idx - 1] : null;
  const nextTopic  = idx < allTopics.length - 1 ? allTopics[idx + 1] : null;

  if (settingsLoading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ color: 'rgba(245,245,247,0.25)', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: '#000' }}>

      <Sidebar
        currentId={currentId}
        completed={completed}
        onSelect={handleTopicSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* ── Toolbar ── */}
        <header style={{
          flexShrink: 0,
          background: '#1c1c1e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
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
                color: 'rgba(245,245,247,0.45)',
                background: 'transparent',
                border: 'none', cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f5f5f7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(245,245,247,0.45)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="2" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              </svg>
            </button>

            {/* Topic info */}
            {topic && (
              <>
                <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{topic.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topic.title}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(10,132,255,0.15)', color: '#0a84ff',
                  flexShrink: 0, display: isMobile ? 'none' : undefined,
                }}>
                  {topic.difficulty}
                </span>
              </>
            )}

            <div style={{ flex: 1 }} />

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

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
                    borderRadius: 6,
                    color: t ? 'rgba(245,245,247,0.50)' : 'rgba(245,245,247,0.18)',
                    background: 'transparent',
                    border: 'none', cursor: t ? 'pointer' : 'not-allowed',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (t) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f5f5f7'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t ? 'rgba(245,245,247,0.50)' : 'rgba(245,245,247,0.18)'; }}
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
                    padding: '5px 12px', borderRadius: 8, border: 'none',
                    fontSize: 12, fontWeight: 500, cursor: isComplete ? 'default' : 'pointer',
                    color: isComplete ? '#30d158' : 'rgba(245,245,247,0.70)',
                    background: isComplete ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.07)',
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

              {/* User avatar + dropdown menu */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  title={userName ? `Account (${userName})` : 'Account'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px 3px 3px',
                    borderRadius: 8,
                    color: 'rgba(245,245,247,0.45)',
                    background: userMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f5f5f7'; }}
                  onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(245,245,247,0.45)'; } }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt=""
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: '1.5px solid rgba(255,255,255,0.12)',
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
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: '#2c2c2e',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                    padding: 6,
                    minWidth: 170,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 100,
                  }}>
                    {userName && (
                      <div style={{
                        padding: '6px 10px 8px',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: 4,
                      }}>
                        <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)', marginBottom: 1 }}>Signed in as</div>
                        <div style={{ fontSize: 13, color: '#f5f5f7', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {userName}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '7px 10px',
                        borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(245,245,247,0.80)',
                        fontSize: 13, textAlign: 'left', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '7px 10px',
                        borderRadius: 7, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: 'rgba(255,69,58,0.85)',
                        fontSize: 13, textAlign: 'left', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.10)'; }}
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

          {/* Row 2 — Tabs */}
          <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 16px', gap: 0 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#f5f5f7' : 'rgba(245,245,247,0.45)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid #0a84ff' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: -1,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
          {topic ? (
            <div
              key={`${currentId}-${activeTab}`}
              className="animate-fadeUp"
              style={{ maxWidth: 740, margin: '0 auto', padding: isMobile ? '24px 16px 100px' : '32px 24px 48px' }}
            >
              {activeTab === 'learn'    && <LearnTab    topic={topic} provider={provider} completed={isComplete} onComplete={markComplete} isMobile={isMobile} />}
              {activeTab === 'diagram'  && <DiagramTab  topic={topic} />}
              {activeTab === 'practice' && <PracticeTab topic={topic} />}
              {activeTab === 'ask'      && <AskTab      topic={topic} provider={provider} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(245,245,247,0.25)', fontSize: 14 }}>
              Select a topic to begin
            </div>
          )}
        </main>

        {/* ── Mobile bottom bar ── */}
        {isMobile && topic && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#1c1c1e',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px 6px',
            gap: 4,
            paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
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
                  border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(10,132,255,0.12)' : 'transparent',
                  color: activeTab === tab.id ? '#0a84ff' : 'rgba(245,245,247,0.35)',
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
                border: 'none',
                fontSize: 12, fontWeight: 500,
                cursor: isComplete ? 'default' : 'pointer',
                color: isComplete ? '#30d158' : 'rgba(245,245,247,0.70)',
                background: isComplete ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.07)',
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
