'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createMeeting, analyzeMeeting } from '@/lib/api';

type Step = 'input' | 'processing' | 'done';

export default function NewMeetingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }
    if (!transcript.trim() && !audioFile) {
      setError('Please paste a transcript or upload an audio file');
      return;
    }

    setError('');
    setStep('processing');

    try {
      // Step 1: Create meeting
      setStatusMsg('Conjuring meeting space...');
      const formData = new FormData();
      formData.append('title', title);
      if (transcript) formData.append('transcript', transcript);
      if (audioFile) formData.append('audio', audioFile);

      const created = await createMeeting(formData);

      // Step 2: Analyze
      setStatusMsg('Scrying the transcripts for patterns...');
      await analyzeMeeting(created.id);

      setStep('done');
      setStatusMsg('Incantation complete! Redirecting...');

      setTimeout(() => {
        router.push(`/meetings/${created.id}`);
      }, 1000);
    } catch (err: unknown) {
      setStep('input');
      const message = err instanceof Error ? err.message : 'The ritual failed. Please try again.';
      setError(message);
    }
  };

  const arcaneAccent = '#D97706'; // Amber
  const arcaneAccentAlt = '#E07A47'; // Crail
  const arcaneBg = '#262624'; // Deep Gray
  const inputBg = arcaneBg; // Match the rest of the UI background
  const textPrimary = '#f3e8d6'; // Warm parchment white
  const textMuted = '#a89f91'; // Muted parchment

  // Common input styles to enforce the amber border
  const inputStyles = {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    background: inputBg,
    border: `1px solid rgba(217, 119, 6, 0.5)`, // Amber border with a bit more presence
    color: textPrimary,
    outline: 'none',
    boxShadow: 'none',
    transition: 'border-color 0.3s ease',
  };

  if (step === 'processing' || step === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: textPrimary }}>
        <div className="animate-pulse-glow" style={{
          padding: '60px 80px',
          textAlign: 'center',
          maxWidth: '500px',
          background: arcaneBg,
          borderRadius: '16px',
          border: `1px solid rgba(217, 119, 6, 0.2)`,
          boxShadow: `0 0 40px rgba(217, 119, 6, 0.05)`,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 24px',
            boxShadow: `0 8px 24px rgba(217, 119, 6, 0.3)`,
          }}>
            {step === 'done' ? '✨' : '🔮'}
          </div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
            {step === 'done' ? 'Ritual Complete!' : 'Channeling...'}
          </h2>
          <p style={{ color: textMuted }}>{statusMsg}</p>

          {step === 'processing' && (
            <div style={{
              marginTop: '24px',
              height: '4px',
              borderRadius: '2px',
              background: inputBg,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '2px',
                background: `linear-gradient(90deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
                animation: 'progressBar 2s ease-in-out infinite',
                width: '60%',
                boxShadow: `0 0 10px ${arcaneAccent}`,
              }} />
            </div>
          )}
        </div>
        <style>{`
          @keyframes progressBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          input:focus, textarea:focus {
            border-color: ${arcaneAccent} !important;
            box-shadow: 0 0 8px rgba(217, 119, 6, 0.3) !important;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: textPrimary }}>
      <div className="animate-fade-in">
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: '4px',
          background: `linear-gradient(135deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'serif' // Adds a slight arcane/ancient touch
        }}>
          New Meeting
        </h1>
        <p style={{ color: textMuted, marginBottom: '32px' }}>
          Offer your transcript or audio runestone for analysis
        </p>
      </div>

      {error && (
        <div className="animate-fade-in" style={{
          padding: '14px 20px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          marginBottom: '20px',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      <div className="animate-fade-in-delay-1" style={{
        padding: '32px',
        background: arcaneBg,
        borderRadius: '16px',
        border: `1px solid rgba(217, 119, 6, 0.15)`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#fff' }}>
            Meeting Designation
          </label>
          <input
            type="text"
            placeholder="e.g. Weekly Scrying Session"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyles}
          />
        </div>

        {/* Transcript */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#fff' }}>
            Incantation Transcript
          </label>
          <textarea
            placeholder={'Inscribe your meeting transcript here...\n\nExample:\nAlice: Let\'s discuss the Q4 roadmap.\nBob: I think we should focus on the mobile app.\nAlice: Agreed. Bob, can you draft a plan by Friday?'}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{ ...inputStyles, minHeight: '220px', resize: 'vertical' }}
          />
        </div>

        {/* Audio Upload */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#fff' }}>
            Or Upload Aural Runestone <span style={{ color: textMuted, fontWeight: 400 }}>(optional)</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${audioFile ? arcaneAccent : 'rgba(217, 119, 6, 0.3)'}`,
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: audioFile ? 'rgba(217, 119, 6, 0.05)' : inputBg,
            }}
            onMouseEnter={(e) => {
              if (!audioFile) (e.currentTarget as HTMLDivElement).style.borderColor = arcaneAccentAlt;
            }}
            onMouseLeave={(e) => {
              if (!audioFile) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(217, 119, 6, 0.3)';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px', textShadow: `0 0 10px ${arcaneAccent}` }}>
              {audioFile ? '🎵' : '📜'}
            </div>
            <p style={{ color: audioFile ? arcaneAccent : textMuted, fontSize: '0.9rem' }}>
              {audioFile ? audioFile.name : 'Click to place audio file (mp3, wav, m4a)'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
            background: `linear-gradient(135deg, ${arcaneAccent}, ${arcaneAccentAlt})`,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: `0 4px 15px rgba(217, 119, 6, 0.3)`,
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 20px rgba(217, 119, 6, 0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 15px rgba(217, 119, 6, 0.3)`;
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            🔮 Begin Ritual
          </span>
        </button>
      </div>
    </div>
  );
}