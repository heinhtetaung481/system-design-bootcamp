'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle PKCE code exchange when redirected back with ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setLoading(true);
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: exchangeError }) => {
        if (exchangeError || !data.user) {
          setError(exchangeError?.message || 'Authentication failed');
          setLoading(false);
          // Clean the URL
          window.history.replaceState({}, '', '/login');
          return;
        }

        // Check if user is in allowed_users table
        const email = data.user.email;
        const githubUsername = data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username;

        const { data: allowedUser } = await supabase
          .from('allowed_users')
          .select('id')
          .or(`email.eq.${email},github_username.eq.${githubUsername}`)
          .limit(1)
          .single();

        if (!allowedUser) {
          await supabase.auth.signOut();
          setError('Your account is not authorized to access this app.');
          setLoading(false);
          window.history.replaceState({}, '', '/login');
          return;
        }

        // Success — redirect to home
        window.location.href = '/';
      });
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${siteUrl}/login`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Manually redirect if the browser didn't auto-redirect
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  // Parse URL params for error messages from callback
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const callbackError = params?.get('error');
  const displayError = error || (callbackError === 'not_allowed' ? 'Your account is not authorized to access this app.' : callbackError === 'auth_failed' ? 'Authentication failed. Please try again.' : '');

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          padding: '48px 32px',
          borderRadius: 20,
          background: '#1c1c1e',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: 400,
          width: '100%',
          margin: '0 16px',
        }}
      >
        {/* Logo / Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#f5f5f7',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            System Design Bootcamp
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(245,245,247,0.45)',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
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
            padding: '12px 20px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#f5f5f7',
            fontSize: 15,
            fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          {loading ? 'Signing in...' : 'Continue with GitHub'}
        </button>

        {displayError && (
          <p
            style={{
              fontSize: 13,
              color: '#ff453a',
              textAlign: 'center',
              lineHeight: 1.5,
              padding: '10px 16px',
              borderRadius: 10,
              background: 'rgba(255,69,58,0.1)',
              border: '1px solid rgba(255,69,58,0.2)',
              width: '100%',
              margin: 0,
            }}
          >
            {displayError}
          </p>
        )}

        <p
          style={{
            fontSize: 12,
            color: 'rgba(245,245,247,0.25)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Access is restricted to approved accounts only.
        </p>
      </div>
    </div>
  );
}
