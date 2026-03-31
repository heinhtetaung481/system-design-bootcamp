'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/modules/identity/lib/supabase-browser';
import { MODEL_OPTIONS } from '@/modules/generation';
import type { ModelProvider } from '@/modules/prompt-templates/types';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const [selected, setSelected] = useState<ModelProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserAvatar(user.user_metadata?.avatar_url || null);
          setUserName(user.user_metadata?.user_name || user.email || null);
        }

        const res = await fetch('/api/user-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.selectedModel) setSelected(data.selectedModel);
        }
      } catch {
        // Fetch failed — loading clears below; user can still select a model
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedModel: selected }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/');
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Glass Header */}
      <header style={{
        flexShrink: 0,
        background: 'rgba(7,7,15,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 52,
        gap: 12,
        position: 'relative',
        zIndex: 10,
      }}>
        {!isSetup && (
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
              color: 'rgba(237,237,245,0.45)', fontSize: 13, padding: '4px 8px',
              borderRadius: 7, transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ededf5';
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(237,237,245,0.45)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}

        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#ededf5',
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.02em',
        }}>
          {isSetup ? '🏗️ System Design Bootcamp' : 'Settings'}
        </span>

        <div style={{ flex: 1 }} />

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {userAvatar && (
            <img src={userAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />
          )}
          {userName && (
            <span style={{ fontSize: 12, color: 'rgba(237,237,245,0.42)' }}>{userName}</span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 7,
              border: '1px solid transparent',
              fontSize: 12, fontWeight: 400, cursor: 'pointer',
              color: 'rgba(237,237,245,0.42)', background: 'transparent',
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
              e.currentTarget.style.color = 'rgba(237,237,245,0.42)';
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>

          {isSetup && (
            <div style={{
              marginBottom: 32, textAlign: 'center',
              padding: '28px 24px',
              borderRadius: 20,
              background: 'rgba(79,142,247,0.07)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(79,142,247,0.20)',
              boxShadow: '0 8px 32px rgba(79,142,247,0.08)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
              <h2 style={{
                fontSize: 20, fontWeight: 700,
                color: '#ededf5',
                margin: '0 0 8px',
                letterSpacing: '-0.03em',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Welcome! One quick step
              </h2>
              <p style={{ fontSize: 13.5, color: 'rgba(237,237,245,0.52)', lineHeight: 1.6, margin: 0 }}>
                Choose your preferred AI model to generate lessons. You can change this later in Settings.
              </p>
            </div>
          )}

          {!isSetup && (
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 24, fontWeight: 700,
                color: '#ededf5',
                margin: '0 0 6px',
                letterSpacing: '-0.04em',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                Account Settings
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(237,237,245,0.42)', margin: 0 }}>
                Configure your AI model preference and account options.
              </p>
            </div>
          )}

          {/* Model selection glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>
            <h2 style={{
              fontSize: 11, fontWeight: 600,
              color: 'rgba(237,237,245,0.40)',
              margin: '0 0 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              AI Model
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(237,237,245,0.42)', margin: '0 0 18px', lineHeight: 1.55 }}>
              The selected model will be used for all lessons and Q&amp;A throughout the app.
            </p>

            {loading ? (
              <div style={{ display: 'flex', gap: 12 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ flex: 1, height: 96, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {MODEL_OPTIONS.map(opt => {
                  const active = selected === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelected(opt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '16px 18px',
                        borderRadius: 14,
                        border: active ? `1.5px solid ${opt.color}` : '1.5px solid rgba(255,255,255,0.09)',
                        background: active
                          ? `rgba(${opt.color === '#FF8C42' ? '255,140,66' : '16,163,127'},0.08)`
                          : 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s',
                        width: '100%',
                        boxShadow: active ? `0 4px 20px ${opt.color}22` : 'none',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    >
                      {/* Color dot */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: active ? opt.color : 'rgba(237,237,245,0.18)',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                        boxShadow: active ? `0 0 8px ${opt.color}80` : 'none',
                      }} />

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 600,
                          color: '#ededf5',
                          marginBottom: 3,
                          fontFamily: "'Space Grotesk', sans-serif",
                          letterSpacing: '-0.01em',
                        }}>
                          {opt.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(237,237,245,0.42)' }}>
                          {opt.description}
                        </div>
                      </div>

                      {/* Radio */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: active ? `5px solid ${opt.color}` : '1.5px solid rgba(255,255,255,0.22)',
                        background: 'transparent',
                        transition: 'all 0.15s',
                      }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p style={{
              fontSize: 13, color: '#f87171', textAlign: 'center',
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.20)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              marginBottom: 16,
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!selected || saving || loading}
            style={{
              width: '100%', padding: '14px 20px',
              borderRadius: 14, border: 'none',
              fontSize: 15, fontWeight: 600,
              cursor: (!selected || saving) ? 'not-allowed' : 'pointer',
              color: '#fff',
              background: selected
                ? 'linear-gradient(135deg, #4f8ef7, #818cf8)'
                : 'rgba(255,255,255,0.08)',
              opacity: (!selected || saving || loading) ? 0.6 : 1,
              transition: 'all 0.18s',
              boxShadow: selected ? '0 4px 24px rgba(79,142,247,0.30)' : 'none',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            {saving ? 'Saving…' : isSetup ? 'Continue to App' : 'Save Settings'}
          </button>

          <p style={{ fontSize: 12, color: 'rgba(237,237,245,0.22)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            API keys are managed server-side. You do not need to provide your own.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(237,237,245,0.35)', fontSize: 14 }}>Loading…</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
