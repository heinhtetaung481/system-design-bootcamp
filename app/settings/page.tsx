'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/modules/identity/lib/supabase-browser';
import type { ModelOption } from '@/modules/prompt-templates/types';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';

  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);

  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState<string | null>(null);
  const [hasOwnKey, setHasOwnKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);

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
          if (data.hasOwnKey) {
            setHasOwnKey(true);
            setApiKeyMasked(data.openrouterApiKey);
          }
        }

        const modelsRes = await fetch('/api/models');
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          if (modelsData.models) setModelOptions(modelsData.models);
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

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    setKeyError('');
    setKeySuccess(false);
    try {
      const res = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouterApiKey: apiKey.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setKeySuccess(true);
      setHasOwnKey(!!apiKey.trim());
      setApiKeyMasked(apiKey.trim() ? `sk-or-...${apiKey.trim().slice(-4)}` : null);
      setApiKey('');
      setTimeout(() => setKeySuccess(false), 3000);
    } catch {
      setKeyError('Failed to save API key. Please try again.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setSavingKey(true);
    setKeyError('');
    try {
      const res = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouterApiKey: null }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      setHasOwnKey(false);
      setApiKeyMasked(null);
      setApiKey('');
    } catch {
      setKeyError('Failed to remove API key.');
    } finally {
      setSavingKey(false);
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
                {modelOptions.map((opt: ModelOption) => {
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
                          ? `${opt.color}14`
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

          {/* OpenRouter API Key glass card */}
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
              OpenRouter API Key
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(237,237,245,0.42)', margin: '0 0 18px', lineHeight: 1.55 }}>
              Use your own key to access all models on your quota. If not set, free models via shared key are used.
            </p>

            {/* Active key display */}
            {hasOwnKey && apiKeyMasked && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.20)',
                marginBottom: 14,
              }}>
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  background: 'rgba(34,197,94,0.15)',
                  color: 'rgba(134,239,172,0.9)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>
                  Active
                </span>
                <span style={{
                  fontSize: 12, color: 'rgba(237,237,245,0.55)',
                  fontFamily: "'JetBrains Mono', monospace",
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {apiKeyMasked}
                </span>
                <button
                  onClick={handleRemoveApiKey}
                  disabled={savingKey}
                  style={{
                    padding: '4px 10px', borderRadius: 7,
                    border: '1px solid rgba(248,113,113,0.25)',
                    background: 'rgba(248,113,113,0.08)',
                    color: 'rgba(248,113,113,0.80)',
                    fontSize: 12, fontWeight: 500, cursor: savingKey ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                    opacity: savingKey ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Key input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={hasOwnKey ? 'Enter new key to replace…' : 'sk-or-v1-…'}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#ededf5',
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(79,142,247,0.50)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'rgba(237,237,245,0.35)', padding: 2, display: 'flex', alignItems: 'center',
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                disabled={savingKey || !apiKey.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: apiKey.trim() ? 'linear-gradient(135deg, #4f8ef7, #818cf8)' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: (savingKey || !apiKey.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (savingKey || !apiKey.trim()) ? 0.55 : 1,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  boxShadow: apiKey.trim() ? '0 4px 16px rgba(79,142,247,0.28)' : 'none',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {savingKey ? 'Saving…' : 'Save Key'}
              </button>
            </div>

            {/* Key feedback */}
            {keyError && (
              <p style={{
                fontSize: 12, color: '#f87171', margin: '10px 0 0',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.20)',
              }}>
                {keyError}
              </p>
            )}
            {keySuccess && (
              <p style={{
                fontSize: 12, color: 'rgba(134,239,172,0.9)', margin: '10px 0 0',
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.20)',
              }}>
                API key saved successfully.
              </p>
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
            Free models are available without a key. Add your OpenRouter key to unlock all models.
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
