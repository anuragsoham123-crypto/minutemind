'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboard, createMeeting, getMyInvitations, acceptInvitation, declineInvitation } from '@/lib/api';
import type { DashboardData, ActionItem, Invitation } from '@/lib/types';
import { CreateModal } from '@/components/ui/CreateModal';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const router = useRouter();

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Could not load dashboard. Is the backend running?'))
      .finally(() => setLoading(false));
    getMyInvitations().then(setInvitations).catch(() => {});
  }, []);

  const handleCreateMeeting = async (modalData: any) => {
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', modalData.title);
      if (modalData.transcript) fd.append('transcript', modalData.transcript);
      if (modalData.audio) fd.append('audio', modalData.audio);
      const res = await createMeeting(fd);
      setShowNewMeeting(false);
      router.push(`/meetings/${res.id}`);
    } catch {
      alert("Failed to create meeting.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl" style={{ minHeight: '60vh', background: 'var(--bg-primary)' }}>
        <div className="rounded-2xl text-center shadow-sm border" style={{ padding: '24px 36px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <img src="/logo.png" alt="MinuteMind Logo" className="w-[48px] h-[48px] object-contain mx-auto mb-4 drop-shadow-sm" />
          <p className="text-neutral-500 font-semibold tracking-wide" style={{ paddingLeft: '10px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center" style={{ padding: '60px 20px' }}>
        <div className="inline-block rounded-2xl border shadow-sm" style={{ padding: '30px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-3xl" style={{ marginBottom: '10px' }}>⚠️</p>
          <p className="text-neutral-500 font-medium" style={{ paddingLeft: '10px', marginBottom: '16px' }}>{error}</p>
          <button onClick={() => setShowNewMeeting(true)} className="text-white font-bold rounded-full transition-colors" style={{ padding: '12px 24px', paddingLeft: '10px', background: 'linear-gradient(135deg, #D97706, #E07A47)' }}>
            Create Your First Meeting
          </button>
        </div>
        <CreateModal
          isOpen={showNewMeeting} onClose={() => setShowNewMeeting(false)} onCreate={handleCreateMeeting}
          mode="meeting" title="Create Meeting" description="Start a new meeting to track action items and decisions." loading={creating}
        />
      </div>
    );
  }

  const stats = [
    { label: 'Total Meetings', value: data?.total_meetings ?? 0, icon: '📋', color: '#38bdf8' },
    { label: 'Total Tasks', value: data?.total_tasks ?? 0, icon: '✅', color: '#6366f1' },
    { label: 'In Progress', value: data?.tasks_in_progress ?? 0, icon: '🔄', color: '#f59e0b' },
    { label: 'Completed', value: data?.tasks_completed ?? 0, icon: '🎉', color: '#16a34a' },
    { label: 'Overdue', value: data?.tasks_overdue ?? 0, icon: '🚨', color: '#dc2626' },
    { label: 'Soft Decisions', value: data?.soft_decisions_count ?? 0, icon: '⚠️', color: '#f59e0b' },
  ];

  return (
    <div className="w-full">
      {/* Invitation Banner */}
      {invitations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          {invitations.map((inv) => (
            <div key={inv.id} className="rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ padding: '16px 20px', gap: '10px', background: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.2)' }}>
              <div style={{ paddingLeft: '10px' }}>
                <span className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>Team Invitation</span>
                <p className="text-[13px]" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>{inv.invited_by_name}</strong> invited you to join <strong>{inv.team_name}</strong>
                </p>
              </div>
              <div className="flex" style={{ gap: '8px' }}>
                <button
                  onClick={async () => { await acceptInvitation(inv.id); setInvitations(prev => prev.filter(i => i.id !== inv.id)); }}
                  className="rounded-xl font-bold text-white text-[12px] uppercase tracking-wider active:scale-95"
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
                >Accept</button>
                <button
                  onClick={async () => { await declineInvitation(inv.id); setInvitations(prev => prev.filter(i => i.id !== inv.id)); }}
                  className="rounded-xl font-bold text-[12px] uppercase tracking-wider"
                  style={{ padding: '10px 20px', background: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
                >Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-neutral-400 font-medium text-[13px]" style={{ paddingLeft: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>Your meeting execution overview</p>
        </div>
        <button onClick={() => setShowNewMeeting(true)} className="text-white rounded-[5rem] tracking-wider uppercase font-bold transition-colors active:scale-95 shadow-lg flex items-center" style={{ padding: '15px 28px', gap: '8px', minHeight: '50px', fontSize: '11px', background: 'linear-gradient(135deg, #D97706, #E07A47)' }}>
          <span style={{ fontSize: '16px' }}>➕</span>
          <span style={{ fontSize: '11px' }}>New Meeting</span>
          <span style={{ fontSize: '8px', color: 'black' }}>.</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6" style={{ gap: '10px', marginBottom: '10px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border shadow-sm animate-fade-in flex flex-col" style={{ padding: '20px', gap: '10px', minHeight: '130px', background: 'var(--bg-card)', borderColor: 'var(--border)' }} >
            <div style={{ fontSize: '20px', paddingLeft: '10px', minHeight: '36px', display: 'flex', alignItems: 'center' }}>{stat.icon}</div>
            <div className="font-extrabold tracking-tight" style={{ fontSize: '28px', color: stat.color, paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              {stat.value}
            </div>
            <div className="text-xs font-bold text-neutral-500 uppercase" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '10px' }}>
        {/* Recent Meetings */}
        <div className="rounded-2xl border shadow-sm animate-fade-in-delay-1 flex flex-col" style={{ padding: '20px', gap: '10px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-[15px] flex items-center text-neutral-800 tracking-wide" style={{ paddingLeft: '10px', gap: '10px', minHeight: '40px' }}>
            <span>📋</span> Recent Meetings
          </h2>
          {(!data?.recent_meetings || data.recent_meetings.length === 0) ? (
            <div className="text-center text-neutral-400" style={{ padding: '30px 10px' }}>
              <p className="font-medium text-[13px]" style={{ paddingLeft: '10px', marginBottom: '10px' }}>No meetings yet</p>
              <button onClick={() => setShowNewMeeting(true)} className="text-black font-semibold text-[13px] hover:underline bg-neutral-100 rounded-xl" style={{ padding: '12px 20px', paddingLeft: '10px' }}>
                Create your first meeting →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.recent_meetings.slice(0, 5).map((m) => (
                <Link key={m.id} href={`/meetings/${m.id}`} className="block group">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl transition-all duration-200 group-hover:bg-white group-hover:border-neutral-300 group-hover:shadow-md flex flex-col" style={{ padding: '16px', gap: '10px' }}>
                    <div className="font-bold text-[14px] text-neutral-900" style={{ paddingLeft: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>{m.title}</div>
                    <div className="text-[12px] text-neutral-500 font-semibold tracking-wide" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>
                      {m.action_items?.length ?? 0} tasks · {m.gaps?.length ?? 0} gaps
                      {m.created_at && ` · ${new Date(m.created_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Attention Needed */}
        <div className="rounded-2xl border shadow-sm animate-fade-in-delay-2 flex flex-col" style={{ padding: '20px', gap: '10px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-[15px] flex items-center text-neutral-800 tracking-wide" style={{ paddingLeft: '10px', gap: '10px', minHeight: '40px' }}>
            <span>⚠️</span> Attention Needed
          </h2>
          {(!data?.attention_needed || data.attention_needed.length === 0) ? (
            <div className="text-center text-neutral-400" style={{ padding: '30px 10px' }}>
              <p className="font-medium text-[13px]" style={{ paddingLeft: '10px' }}>All clear! No items need attention.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.attention_needed.slice(0, 6).map((item: ActionItem, i: number) => (
                <div key={i} className="bg-red-50/50 border border-red-200 rounded-xl flex flex-col" style={{ padding: '16px', gap: '10px' }}>
                  <div className="font-bold text-neutral-900 text-[13px]" style={{ paddingLeft: '10px', minHeight: '28px', display: 'flex', alignItems: 'center' }}>{item.task}</div>
                  <div className="flex flex-wrap text-[11px] font-bold" style={{ paddingLeft: '10px', gap: '10px' }}>
                    <span className={`uppercase tracking-widest rounded-full ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`} style={{ padding: '6px 14px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>{item.priority}</span>
                    <span className="bg-neutral-100 text-neutral-600 rounded-full" style={{ padding: '6px 14px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                      Confidence: {Math.round(item.confidence_score * 100)}%
                    </span>
                    {item.owner && (
                      <span className="bg-orange-100 text-orange-700 rounded-full" style={{ padding: '6px 14px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>Owner: {item.owner} (unverified)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateModal
        isOpen={showNewMeeting} onClose={() => setShowNewMeeting(false)} onCreate={handleCreateMeeting}
        mode="meeting" title="Create Meeting" description="Start a new meeting to track action items and decisions." loading={creating}
      />
    </div>
  );
}
