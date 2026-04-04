'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-card animate-pulse-glow" style={{ padding: '40px 60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div className="glass-card animate-fade-in" style={{
        padding: '48px 56px',
        textAlign: 'center',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <img 
          src="/logo.png" 
          alt="MinuteMind" 
          style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 24px' }} 
        />

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
          Sign in to MinuteMind
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '36px', fontSize: '0.9rem' }}>
          AI-powered meeting execution for your team
        </p>

        <button
          onClick={signInWithGoogle}
          className="btn-gradient"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p style={{ color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.75rem' }}>
          Your API keys are stored securely on the server.<br />
          No AI calls are made from your browser.
        </p>
      </div>
    </div>
  );
}
