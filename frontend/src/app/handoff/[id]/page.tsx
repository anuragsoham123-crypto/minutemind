'use client';

import { useEffect, useState, use } from 'react';
import { getHandoff } from '@/lib/api';
import type { HandoffCard, ActionItem } from '@/lib/types';
import Head from 'next/head';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function HandoffPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<HandoffCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Arcane Theme Constants
  const arcaneAccent = '#D97706'; // Amber
  const arcaneAccentAlt = '#E07A47'; // Crail
  const arcaneBg = '#262624'; // Deep Gray
  const inputBg = '#1c1c1a'; // Darker inset
  const textPrimary = '#f3e8d6'; // Warm parchment
  const textMuted = '#a89f91'; // Muted parchment

  useEffect(() => {
    getHandoff(resolvedParams.id)
      .then(setData)
      .catch(() => setError('The runestone could not be found or has faded.'))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const element = document.getElementById('handoff-content');

    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: arcaneBg // Forces the dark arcane background in the PDF
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const filename = data?.title ? `${data.title.replace(/\s+/g, '-')}-Runestone.pdf` : 'MinuteMind-Runestone.pdf';
        pdf.save(filename);
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Failed to inscribe the PDF. Please try again.');
      }
    }
    setIsGenerating(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: inputBg, color: textPrimary }}>
        <div style={{ padding: '40px', textAlign: 'center', background: arcaneBg, borderRadius: '16px', border: `1px solid rgba(217, 119, 6, 0.2)` }}>
          <div className="animate-pulse" style={{ fontSize: '2rem', marginBottom: '16px' }}>🔮</div>
          <p style={{ color: textMuted, fontWeight: 'bold' }}>Deciphering runestone...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: inputBg, color: textPrimary }}>
        <div style={{ padding: '40px', textAlign: 'center', background: arcaneBg, borderRadius: '16px', border: `1px solid rgba(239, 68, 68, 0.3)`, maxWidth: '400px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🥀</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Incantation Failed</h2>
          <p style={{ color: textMuted }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: inputBg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', fontFamily: 'sans-serif' }}>
      <Head>
        <title>{data.title} - Arcane Handoff</title>
      </Head>

      {/* Top Action Bar */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ color: textMuted, fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          📜 Strategic Runestone
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          style={{
            background: `linear-gradient(135deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            boxShadow: `0 4px 15px rgba(217, 119, 6, 0.3)`,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isGenerating ? '⏳ Inscribing...' : '⬇️ Download Tome (PDF)'}
        </button>
      </div>

      {/* PDF Target Container 
        Max-width locked to 800px for perfect A4 scaling.
        Colors explicitly set using Hex to avoid Tailwind oklab crashes.
      */}
      <div style={{ width: '100%', maxWidth: '800px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', overflow: 'hidden' }}>

        <div id="handoff-content" style={{ backgroundColor: arcaneBg, color: textPrimary, padding: '48px', boxSizing: 'border-box' }}>

          {/* Header Area */}
          <div style={{ borderBottom: `1px solid rgba(217, 119, 6, 0.2)`, paddingBottom: '32px', marginBottom: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '0.15em', textTransform: 'uppercase', color: textMuted }}>MinuteMind</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: inputBg, color: arcaneAccent, padding: '4px 12px', borderRadius: '999px', border: `1px solid rgba(217, 119, 6, 0.3)` }}>
                Finalized
              </span>
            </div>

            {data.date && (
              <p style={{ color: arcaneAccent, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                {new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}

            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '24px',
              fontFamily: 'serif',
              background: `linear-gradient(135deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {data.title}
            </h1>

            {/* Metric Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {data.remeeting_risk_score !== undefined && (
                <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: inputBg, border: `1px solid ${data.remeeting_risk_score > 50 ? '#ef4444' : 'rgba(217, 119, 6, 0.3)'}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: data.remeeting_risk_score > 50 ? '#fca5a5' : textPrimary }}>
                  <span style={{ fontSize: '16px' }}>{data.remeeting_risk_score > 50 ? '⚠️' : '👁️'}</span>
                  {data.remeeting_risk_score}% Re-meeting Risk
                </div>
              )}
              <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: inputBg, border: `1px solid rgba(217, 119, 6, 0.3)`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: textPrimary }}>
                <span style={{ fontSize: '16px' }}>⚖️</span>
                {data.decisions.length} Decisions
              </div>
              <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: inputBg, border: `1px solid rgba(217, 119, 6, 0.3)`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', color: textPrimary }}>
                <span style={{ fontSize: '16px' }}>⚔️</span>
                {data.tasks.length} Action Items
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Primary Risk */}
            {data.bomb_risks && data.bomb_risks.length > 0 && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: `4px solid #ef4444`, borderRadius: '0 12px 12px 0', padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', borderLeftWidth: '4px' }}>
                <h3 style={{ color: '#fca5a5', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🧨</span> Critical Unspoken Risk
                </h3>
                <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', lineHeight: 1.5, marginBottom: '8px' }}>{data.bomb_risks[0].description}</p>
                <p style={{ color: '#f87171', fontSize: '14px', lineHeight: 1.5 }}>{data.bomb_risks[0].reason}</p>
              </div>
            )}

            {/* TLDR Summary */}
            {data.summary && (
              <section>
                <h3 style={{ color: arcaneAccent, fontFamily: 'serif', fontWeight: 800, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', borderBottom: `1px solid rgba(217, 119, 6, 0.2)`, paddingBottom: '8px' }}>
                  The Oracle's Summary
                </h3>
                <p style={{ color: textPrimary, fontSize: '15px', lineHeight: 1.8 }}>{data.summary.split('\n')[0]}</p>
              </section>
            )}

            {/* Decisions */}
            {data.decisions.length > 0 && (
              <section>
                <h3 style={{ color: arcaneAccent, fontFamily: 'serif', fontWeight: 800, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', borderBottom: `1px solid rgba(217, 119, 6, 0.2)`, paddingBottom: '8px' }}>
                  Decrees & Decisions
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.decisions.map((d, i) => (
                    <li key={i} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', backgroundColor: inputBg, border: `1px solid rgba(217, 119, 6, 0.1)`, alignItems: 'flex-start' }}>
                      <div style={{ backgroundColor: arcaneBg, border: `1px solid rgba(217, 119, 6, 0.4)`, color: arcaneAccent, fontWeight: 900, borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                        {i + 1}
                      </div>
                      <p style={{ color: textPrimary, fontWeight: 'bold', lineHeight: 1.6, margin: 0, paddingTop: '4px' }}>
                        {typeof d === 'string' ? d : d.decision}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Next Steps */}
            {data.tasks.length > 0 && (
              <section>
                <h3 style={{ color: arcaneAccent, fontFamily: 'serif', fontWeight: 800, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', borderBottom: `1px solid rgba(217, 119, 6, 0.2)`, paddingBottom: '8px' }}>
                  Burden of Action
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.tasks.map((t: ActionItem, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', borderRadius: '12px', backgroundColor: inputBg, border: `1px solid rgba(217, 119, 6, 0.1)` }}>
                      <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', lineHeight: 1.4, margin: 0 }}>{t.task}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: arcaneBg, border: `1px solid rgba(217, 119, 6, 0.2)`, color: textMuted, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          👤 {t.owner || 'Unclaimed'}
                        </span>
                        {t.deadline && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(217, 119, 6, 0.1)', border: `1px solid rgba(217, 119, 6, 0.3)`, color: arcaneAccent, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            ⏳ {t.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          <div style={{ borderTop: `1px solid rgba(217, 119, 6, 0.2)`, marginTop: '48px', paddingTop: '24px', textAlign: 'center' }}>
            <p style={{ color: textMuted, fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>Inscribed by MinuteMind AI</p>
          </div>

        </div>
      </div>
    </div>
  );
}