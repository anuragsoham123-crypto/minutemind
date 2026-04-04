'use client';

import { useState, useEffect } from 'react';
import { generateBrief, listTeams } from '@/lib/api';
import { BriefReport, Team } from '@/lib/types';
import {
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Search,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BriefsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [report, setReport] = useState<BriefReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listTeams().then(setTeams).catch(console.error);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await generateBrief({
        team_id: selectedTeam || undefined,
        topic: topic || undefined
      });
      setReport(res);
    } catch (err) {
      alert('Failed to generate brief. Please ensure you have past meetings with tasks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 min-h-[calc(100vh-48px)] flex flex-col justify-center">
      {/* Header */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 text-white" style={{ margin: '10px 0' }}>
          <FileText size={32} />
        </div>
        <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight" style={{ margin: '10px 0' }}>Pre-Meeting Brief</h1>
        <p className="text-neutral-500 font-medium max-w-lg mx-auto text-center" style={{ margin: '10px auto' }}>
          Synthesize unresolved tasks, ambiguous decisions, and open gaps into a strategic agenda for your next session.
        </p>
      </div>

      {/* Input Section */}
      {!report && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col gap-8"
          style={{ padding: '39px', minHeight: '350px' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Users size={14} /> Context: Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => { setSelectedTeam(e.target.value); if (e.target.value) setTopic(''); }}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-[32px] text-sm focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">Select a Team (Optional)</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Search size={14} /> Context: Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); if (e.target.value) setSelectedTeam(''); }}
                placeholder="e.g. Q4 Planning, Hiring..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-[32px] text-sm focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedTeam && !topic}
            className="w-full rounded-2xl bg-purple-900 hover:bg-purple-800 disabled:opacity-50 text-white font-bold py-[40px] flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98]"
          >
            <Sparkles size={20} /> Generate Intelligence Brief
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-neutral-800">Synthesizing Context</h3>
            <p className="text-neutral-500 font-medium animate-pulse italic">Scanning previous transcripts and action items...</p>
          </div>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="space-y-8 animate-fade-in pb-20">
          <div className="flex justify-between items-center px-4">
            <button onClick={() => setReport(null)} className="text-[13px] font-bold text-neutral-400 hover:text-neutral-600 flex items-center gap-1">
              <ChevronRight size={16} className="rotate-180" /> Start Over
            </button>
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">
              Generated {new Date(report.generated_at).toLocaleTimeString()}
            </span>
          </div>

          {/* Agenda Section */}
          <div className="bg-white rounded-[2rem] border border-neutral-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2">
              <Sparkles size={24} className="text-indigo-500" /> Suggested Agenda
            </h2>
            <div className="space-y-6">
              {report.suggested_agenda.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${item.priority === 'high' ? 'bg-red-500' :
                        item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                      {item.title}
                      <span className={`text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded border ${item.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                          item.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>{item.priority}</span>
                    </h3>
                    <p className="text-[14px] text-neutral-500 leading-relaxed mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Unresolved Tasks */}
            <div className="bg-neutral-50 rounded-[2rem] border border-neutral-200 p-8">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" /> Pending Accountability
              </h3>
              <div className="space-y-4">
                {report.unresolved_tasks.length ? report.unresolved_tasks.map((t, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-200/50 shadow-sm">
                    <p className="text-[14px] font-bold text-neutral-800">{t.task}</p>
                    <p className="text-[12px] text-neutral-400 mt-1 font-medium italic">Owner: {t.owner || 'Unknown'}</p>
                  </div>
                )) : <p className="text-neutral-400 italic text-sm">All clear! No pending tasks.</p>}
              </div>
            </div>

            {/* Strategic Risks */}
            <div className="bg-red-900 text-white rounded-[2rem] p-8 shadow-xl shadow-red-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-200">
                <ShieldAlert size={18} /> Strategic Blindspots
              </h3>
              <div className="space-y-6">
                {report.strategic_risks.map((risk, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 shrink-0"><ArrowRight size={16} className="text-red-400" /></div>
                    <p className="text-[14px] text-red-50 leading-relaxed font-medium">{risk}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Soft Decisions/Gaps Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-amber-50 rounded-[2rem] border border-amber-200 p-8">
              <h3 className="text-lg font-bold text-amber-900 mb-6 flex items-center gap-2">
                <AlertCircle size={18} /> Re-litigate (Soft)
              </h3>
              <div className="space-y-4">
                {report.soft_decisions_to_review.length ? report.soft_decisions_to_review.map((d, i) => (
                  <div key={i} className="bg-white/80 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[14px] font-bold text-amber-900">{d.decision}</p>
                    <p className="text-[11px] text-amber-600 mt-1 uppercase font-bold tracking-wider">Low Confidence Decision</p>
                  </div>
                )) : <p className="text-amber-600/50 italic text-sm text-center py-4">No ambiguous decisions found.</p>}
              </div>
            </div>

            <div className="bg-blue-50 rounded-[2rem] border border-blue-200 p-8">
              <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                <HelpCircle size={18} /> Contextual Gaps
              </h3>
              <div className="space-y-4">
                {report.open_gaps.length ? report.open_gaps.map((g, i) => (
                  <div key={i} className="bg-white/80 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[14px] font-bold text-blue-900">{g.description}</p>
                  </div>
                )) : <p className="text-blue-600/50 italic text-sm text-center py-4">No open questions detected.</p>}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
