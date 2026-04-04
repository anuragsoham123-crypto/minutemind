'use client';

import { useEffect, useState, use } from 'react';
import { getTeam, inviteToTeam, removeMember } from '@/lib/api';
import type { Team, TeamMember } from '@/lib/types';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadTeam = () => {
    getTeam(id)
      .then(setTeam)
      .catch(() => alert('Failed to load team'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeam(); }, [id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteToTeam(id, { email: inviteEmail.trim(), name: inviteName.trim() || undefined });
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
      loadTeam();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    try {
      await removeMember(id, email);
      loadTeam();
    } catch {
      alert('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>Loading team...</p>
      </div>
    );
  }

  if (!team) return <p style={{ color: 'var(--text-muted)' }}>Team not found.</p>;

  const members = (team.members || []) as TeamMember[];
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ paddingLeft: '10px', color: 'var(--text-primary)' }}>{team.name}</h1>
          {team.department && (
            <span className="text-[11px] font-bold uppercase tracking-wider rounded-full inline-block" style={{ color: '#0ea5e9', background: 'rgba(56,189,248,0.1)', padding: '4px 12px', marginLeft: '10px' }}>
              {team.department}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2" style={{ marginTop: '10px' }}>
          <button
            onClick={() => window.location.href = `/workload?team_id=${id}`}
            className="rounded-xl tracking-wider uppercase font-bold transition-all active:scale-95 shadow-md flex items-center border"
            style={{ padding: '12px 24px', gap: '8px', fontSize: '11px', background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            📊 Workload Radar
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="text-white rounded-xl tracking-wider uppercase font-bold transition-colors active:scale-95 shadow-lg flex items-center"
            style={{ padding: '12px 24px', gap: '8px', fontSize: '11px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
          >
            ✉️ Invite Employee
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: 'var(--bg-card)', padding: '28px' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Invite Employee</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', paddingLeft: '10px' }}>Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="employee@company.com"
                className="w-full rounded-xl border outline-none focus:border-sky-400"
                style={{ padding: '14px 16px', paddingLeft: '10px', background: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', paddingLeft: '10px', marginTop: '6px' }}>Name (optional)</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border outline-none focus:border-sky-400"
                style={{ padding: '14px 16px', paddingLeft: '10px', background: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)', paddingLeft: '10px', marginTop: '10px' }}>
              The employee must accept the invitation after logging in.
            </p>
            <div className="flex justify-end" style={{ gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowInvite(false)} className="rounded-xl font-bold" style={{ padding: '12px 24px', fontSize: '13px', background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-xl font-bold text-white disabled:opacity-50 active:scale-95" style={{ padding: '12px 24px', fontSize: '13px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="rounded-2xl border shadow-sm" style={{ padding: '20px', background: 'var(--bg-card)', borderColor: 'var(--border)', marginBottom: '10px' }}>
        <h2 className="font-bold text-[15px] flex items-center" style={{ paddingLeft: '10px', gap: '10px', color: 'var(--text-primary)', marginBottom: '10px' }}>
          <span>👥</span> Active Members ({activeMembers.length})
        </h2>
        {activeMembers.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-muted)', paddingLeft: '10px' }}>No active members yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border" style={{ padding: '14px 16px', borderColor: 'var(--border)' }}>
                <div style={{ paddingLeft: '10px' }}>
                  <span className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>{m.name || m.email}</span>
                  <span className="text-[12px] ml-2" style={{ color: 'var(--text-muted)' }}>{m.email}</span>
                  {m.role === 'coordinator' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider rounded-full ml-2" style={{ padding: '2px 8px', background: 'rgba(56,189,248,0.1)', color: '#0ea5e9' }}>Coordinator</span>
                  )}
                </div>
                {m.role !== 'coordinator' && (
                  <button onClick={() => handleRemove(m.email)} className="text-[12px] font-bold rounded-lg" style={{ padding: '6px 12px', color: '#dc2626' }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div className="rounded-2xl border shadow-sm" style={{ padding: '20px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-[15px] flex items-center" style={{ paddingLeft: '10px', gap: '10px', color: 'var(--text-primary)', marginBottom: '10px' }}>
            <span>⏳</span> Pending ({pendingMembers.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border" style={{ padding: '14px 16px', borderColor: 'var(--border)', opacity: 0.7 }}>
                <div style={{ paddingLeft: '10px' }}>
                  <span className="font-medium text-[14px]" style={{ color: 'var(--text-secondary)' }}>{m.name || m.email}</span>
                  <span className="text-[12px] ml-2" style={{ color: 'var(--text-muted)' }}>{m.email}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider rounded-full ml-2" style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>Pending</span>
                </div>
                <button onClick={() => handleRemove(m.email)} className="text-[12px] font-bold rounded-lg" style={{ padding: '6px 12px', color: '#dc2626' }}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
