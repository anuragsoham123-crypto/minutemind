'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🧠',
    title: 'AI-Powered Analysis',
    desc: 'Extract action items, decisions, and gaps from your meeting transcripts automatically.',
  },
  {
    icon: '🎯',
    title: 'Confidence Scoring',
    desc: 'Every task gets a confidence score. Low-confidence items surface for manual review.',
  },
  {
    icon: '✏️',
    title: 'Full Editing Loop',
    desc: 'Edit, reassign, and fix any task inline. Complete control over AI-generated outputs.',
  },
  {
    icon: '🎤',
    title: 'Audio Support',
    desc: 'Upload audio recordings — Whisper transcribes, then AI extracts structured data.',
  },
  {
    icon: '⚠️',
    title: 'Attention Needed',
    desc: 'Gaps section flags missing owners, deadlines, and ambiguous assignments.',
  },
  {
    icon: '📊',
    title: 'Execution Dashboard',
    desc: 'Track task status, overdue items, and team progress in one unified view.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Ambient background gradient */}
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

      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="MinuteMind Logo" 
            style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }} className="gradient-text">MinuteMind</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard">
            <button className="btn-ghost">Dashboard</button>
          </Link>
          <Link href="/meetings/new">
            <button className="btn-gradient"><span>Get Started</span></button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px 60px',
        position: 'relative',
        zIndex: 10,
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div className="animate-fade-in">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '30px',
            background: 'var(--accent-glow)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            marginBottom: '32px',
            fontSize: '0.85rem',
            color: '#818cf8',
            fontWeight: 500,
          }}>
            ✨ AI-Powered Meeting Execution
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            Turn Meetings Into{' '}
            <span className="gradient-text">Executed Tasks</span>
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '650px',
            margin: '0 auto 48px',
            lineHeight: 1.7,
          }}>
            Stop losing action items in meeting notes. MinuteMind extracts decisions, assigns tasks,
            and tracks completion — so nothing falls through the cracks.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/meetings/new">
              <button className="btn-gradient" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
                <span>Analyze a Meeting →</span>
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-ghost" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
                View Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '60px 24px',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          marginBottom: '48px',
        }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { step: '01', label: 'Paste or Upload', sub: 'Transcript text or audio file' },
            { step: '02', label: 'AI Analyzes', sub: 'Gemini + confidence scoring' },
            { step: '03', label: 'Review & Edit', sub: '4 structured sections' },
            { step: '04', label: 'Track & Execute', sub: 'Dashboard for accountability' },
          ].map((item, i) => (
            <div key={i} className={`animate-fade-in-delay-${i + 1}`}
              style={{ textAlign: 'center', flex: '1', minWidth: '180px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'white',
              }}>
                {item.step}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{item.label}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '60px 24px 100px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--text-muted)',
          marginBottom: '48px',
        }}>
          Features
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {features.map((f, i) => (
            <div key={i} className={`glass-card animate-fade-in-delay-${(i % 4) + 1}`}
              style={{ padding: '28px' }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '16px',
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 48px',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        position: 'relative',
        zIndex: 10,
      }}>
        MinuteMind — AI Meeting Execution System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
