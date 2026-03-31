'use client';

import { useState } from 'react';
import { createClient } from '@/modules/identity/lib/supabase-browser';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${siteUrl}/auth/callback` },
      });

      if (authError) { setError(authError.message); setLoading(false); return; }
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setLoading(false);
    }
  };

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const callbackError = params?.get('error');
  const displayError = error || (
    callbackError === 'not_allowed'  ? 'Your account is not authorized to access this app.' :
    callbackError === 'auth_failed'  ? 'Authentication failed. Please try again.' :
    callbackError || ''
  );

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Extra centre glow for login page */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Glass card */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: '48px 36px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
        maxWidth: 400,
        width: '100%',
        margin: '0 16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 68, height: 68,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(79,142,247,0.20), rgba(129,140,248,0.15))',
            border: '1px solid rgba(79,142,247,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
            margin: '0 auto 20px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}>
            🏗️
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#ededf5',
            letterSpacing: '-0.04em',
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            System Design
          </h1>
          <div style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(237,237,245,0.50)',
            marginTop: 2,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.01em',
          }}>
            Interview Bootcamp
          </div>
          <p style={{
            fontSize: 13.5,
            color: 'rgba(237,237,245,0.45)',
            marginTop: 12,
            lineHeight: 1.55,
          }}>
            Sign in to access AI-powered system design lessons.
          </p>
        </div>

        {/* GitHub Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '13px 20px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.14)',
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#ededf5',
            fontSize: 15,
            fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          {loading ? 'Signing in…' : 'Continue with GitHub'}
        </button>

        {displayError && (
          <p style={{
            fontSize: 13,
            color: '#f87171',
            textAlign: 'center',
            lineHeight: 1.5,
            padding: '10px 16px',
            borderRadius: 10,
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.20)',
            width: '100%',
            margin: 0,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            {displayError}
          </p>
        )}

        <p style={{
          fontSize: 12,
          color: 'rgba(237,237,245,0.22)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Access is restricted to approved accounts only.
        </p>
      </div>
    </div>
  );
}
