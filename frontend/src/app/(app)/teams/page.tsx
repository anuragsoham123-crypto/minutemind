'use client';

import { useEffect, useState } from 'react';
import { listTeams, createTeam, deleteTeam, scanDependencies } from '@/lib/api';
import type { Team, DependenciesResponse } from '@/lib/types';
import Link from 'next/link';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [creating, setCreating] = useState(false);
  const [depsData, setDepsData] = useState<DependenciesResponse | null>(null);
  const [scanningDeps, setScanningDeps] = useState(false);

  const loadTeams = () => {
    listTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createTeam({ name: newName.trim(), department: newDept.trim() || undefined });
      setNewName('');
      setNewDept('');
      setShowCreate(false);
      loadTeams();
    } catch {
      alert('Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    try {
      await deleteTeam(teamId);
      loadTeams();
    } catch {
      alert('Failed to delete team.');
    }
  };

  const handleScanDeps = async () => {
    setScanningDeps(true);
    try {
      const res = await scanDependencies();
      setDepsData(res);
    } catch {
      alert("Failed to scan organizational cross-team dependencies");
    } finally {
      setScanningDeps(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl" style={{ minHeight: '60vh', background: 'var(--bg-primary)' }}>
        <div className="rounded-2xl text-center shadow-sm border" style={{ padding: '24px 36px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }} className="font-semibold tracking-wide">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>Teams</h1>
          <p className="font-medium text-[13px]" style={{ paddingLeft: '10px', color: 'var(--text-muted)' }}>Manage your teams and invite employees</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleScanDeps}
            disabled={scanningDeps}
            className="text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-[5rem] tracking-wider uppercase font-bold transition-all active:scale-95 shadow-sm flex items-center disabled:opacity-50"
            style={{ padding: '15px 28px', gap: '8px', minHeight: '50px', fontSize: '11px' }}
          >
            <span style={{ fontSize: '16px' }}>{scanningDeps ? '⏳' : '🕸️'}</span>
            <span style={{ fontSize: '11px' }}>{scanningDeps ? 'Scanning...' : 'Scan Dependencies'}</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="text-white rounded-[5rem] tracking-wider uppercase font-bold transition-colors active:scale-95 shadow-lg flex items-center"
            style={{ padding: '15px 28px', gap: '8px', minHeight: '50px', fontSize: '11px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
          >
            <span style={{ fontSize: '16px' }}>➕</span>
            <span style={{ fontSize: '11px' }}>New Team</span>
          </button>
        </div>
      </div>

      {/* Dependency Mapper Widget */}
      {depsData && (
        <div className="mb-6 animate-fade-in">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-12 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <span className="text-8xl">🕸️</span>
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-normal">Cross-Team Dependency Map</h2>
            <p className="text-indigo-200 text-[15px] font-medium mb-8 leading-loose">AI detected {depsData.dependencies.length} organizational bottlenecks hiding across silos.</p>
            
            {depsData.dependencies.length === 0 ? (
              <div className="bg-white/10 rounded-2xl p-8 text-center backdrop-blur-sm border border-white/10">
                <p className="text-white font-bold tracking-wide">✅ No cross-team blocks detected!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {depsData.dependencies.map((dep, i) => (
                  <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-md transition hover:bg-white/20">
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Waiting</span>
                      <span className="font-bold">{dep.waiting_team}</span>
                      <span className="text-indigo-300">→</span>
                      <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Blocker</span>
                      <span className="font-bold">{dep.blocking_team}</span>
                    </div>
                    <p className="text-[15px] font-medium leading-loose mb-4">{dep.description}</p>
                    <div className="bg-indigo-950/50 p-5 rounded-xl border border-indigo-500/30">
                      <p className="text-[13px] text-indigo-200 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span>💡</span> Recommended Action
                      </p>
                      <p className="text-[14px] leading-loose text-indigo-100">{dep.recommended_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: 'var(--bg-card)', padding: '28px' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Create Team</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', paddingLeft: '10px' }}>Team Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Marketing Team"
                className="w-full rounded-xl border outline-none focus:border-sky-400"
                style={{ padding: '14px 16px', paddingLeft: '10px', background: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
              <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', paddingLeft: '10px', marginTop: '6px' }}>Department (optional)</label>
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="e.g. Marketing"
                className="w-full rounded-xl border outline-none focus:border-sky-400"
                style={{ padding: '14px 16px', paddingLeft: '10px', background: 'var(--bg-card-hover)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
            <div className="flex justify-end" style={{ gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowCreate(false)} className="rounded-xl font-bold transition-colors" style={{ padding: '12px 24px', fontSize: '13px', background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()} className="rounded-xl font-bold text-white transition-colors active:scale-95 disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '13px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="rounded-2xl text-center border shadow-sm flex flex-col items-center" style={{ padding: '40px', gap: '10px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-4xl" style={{ minHeight: '50px' }}>👥</span>
          <p className="font-medium text-[14px]" style={{ color: 'var(--text-muted)', paddingLeft: '10px' }}>No teams yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '10px' }}>
          {teams.map((team) => (
            <div key={team.id} className="rounded-2xl border shadow-sm flex flex-col transition-all hover:shadow-md" style={{ padding: '20px', gap: '10px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[16px]" style={{ color: 'var(--text-primary)', paddingLeft: '10px' }}>{team.name}</h3>
                  {team.department && (
                    <span className="text-[11px] font-bold uppercase tracking-wider rounded-full" style={{ color: '#0ea5e9', background: 'rgba(56,189,248,0.1)', padding: '4px 12px', marginLeft: '10px', display: 'inline-block', marginTop: '6px' }}>
                      {team.department}
                    </span>
                  )}
                </div>
                <button onClick={() => handleDelete(team.id)} className="text-[12px] font-bold rounded-lg transition-colors hover:bg-red-50" style={{ padding: '6px 12px', color: '#dc2626' }}>
                  Delete
                </button>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)', paddingLeft: '10px' }}>
                {team.member_count || 0} member{(team.member_count || 0) !== 1 ? 's' : ''}
              </p>
              <Link href={`/teams/${team.id}`} className="text-[13px] font-bold rounded-xl text-center transition-colors" style={{ padding: '10px', color: '#0ea5e9', background: 'rgba(56,189,248,0.08)' }}>
                View Team →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
