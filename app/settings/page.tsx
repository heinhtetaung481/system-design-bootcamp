'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { MODEL_OPTIONS } from '@/lib/ai-providers';
import { ModelProvider } from '@/types';

export default function SettingsPage() {
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.user_name || user.email || null);
      }

      const res = await fetch('/api/user-settings');
      const data = await res.json();
      if (data.selectedModel) setSelected(data.selectedModel);
      setLoading(false);
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
    <div style={{ minHeight: '100dvh', background: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        background: '#1c1c1e',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: 52,
        gap: 12,
      }}>
        {!isSetup && (
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(245,245,247,0.50)', fontSize: 13, padding: '4px 8px',
              borderRadius: 6, transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f5f5f7'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.50)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}

        <span style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7' }}>
          {isSetup ? '🏗️ System Design Bootcamp' : 'Settings'}
        </span>

        <div style={{ flex: 1 }} />

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {userAvatar && (
            <img src={userAvatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)' }} />
          )}
          {userName && (
            <span style={{ fontSize: 12, color: 'rgba(245,245,247,0.45)' }}>{userName}</span>
          )}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, border: 'none',
              fontSize: 12, fontWeight: 400, cursor: 'pointer',
              color: 'rgba(245,245,247,0.45)', background: 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f5f5f7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(245,245,247,0.45)'; }}
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
              padding: '24px',
              borderRadius: 16,
              background: 'rgba(10,132,255,0.08)',
              border: '1px solid rgba(10,132,255,0.20)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f7', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                Welcome! One quick step
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(245,245,247,0.55)', lineHeight: 1.6, margin: 0 }}>
                Choose your preferred AI model to generate lessons. You can change this later in Settings.
              </p>
            </div>
          )}

          {!isSetup && (
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f5f5f7', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Account Settings
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(245,245,247,0.45)', margin: 0 }}>
                Configure your AI model preference and account options.
              </p>
            </div>
          )}

          {/* Model selection */}
          <div style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(245,245,247,0.55)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Model
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(245,245,247,0.45)', margin: '0 0 16px', lineHeight: 1.5 }}>
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
                        borderRadius: 12,
                        border: active ? `1.5px solid ${opt.color}` : '1.5px solid rgba(255,255,255,0.08)',
                        background: active ? `rgba(${opt.color === '#FF8C42' ? '255,140,66' : '16,163,127'},0.08)` : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        width: '100%',
                      }}
                    >
                      {/* Color dot */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: active ? opt.color : 'rgba(245,245,247,0.20)',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }} />

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', marginBottom: 3 }}>
                          {opt.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.45)' }}>
                          {opt.description}
                        </div>
                      </div>

                      {/* Radio */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: active ? `5px solid ${opt.color}` : '1.5px solid rgba(255,255,255,0.25)',
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
              fontSize: 13, color: '#ff453a', textAlign: 'center',
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)',
              marginBottom: 16,
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!selected || saving || loading}
            style={{
              width: '100%', padding: '13px 20px',
              borderRadius: 12, border: 'none',
              fontSize: 15, fontWeight: 600, cursor: (!selected || saving) ? 'not-allowed' : 'pointer',
              color: '#fff',
              background: selected ? '#0a84ff' : 'rgba(255,255,255,0.10)',
              opacity: (!selected || saving || loading) ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'Saving…' : isSetup ? 'Continue to App' : 'Save Settings'}
          </button>

          <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.25)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            API keys are managed server-side. You do not need to provide your own.
          </p>
        </div>
      </main>
    </div>
  );
}
