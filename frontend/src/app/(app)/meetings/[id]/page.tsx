'use client';

import { useEffect, useState, use } from 'react';
import { getMeeting, updateMeeting, updateTask, resolveGap, sendReminder, analyzeMeeting, createTask } from '@/lib/api';
import type { Meeting, ActionItem, Decision } from '@/lib/types';
import { ContinuousTabs } from '@/components/ui/ContinuousTabs';
import { InlineTableControl } from '@/components/ui/InlineTableControl';
import { DialogStack } from '@/components/ui/DialogStack';
import { CreateModal } from '@/components/ui/CreateModal';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('summary');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const [reminderTask, setReminderTask] = useState<ActionItem | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const loadMeeting = async () => {
    try {
      const data = await getMeeting(resolvedParams.id);
      setMeeting(data);
      setSummaryDraft(data.summary || '');
    } catch (err) {
      setError('Could not load meeting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [resolvedParams.id]);

  const handleSaveSummary = async () => {
    if (!meeting) return;
    await updateMeeting(meeting.id, { summary: summaryDraft });
    setMeeting({ ...meeting, summary: summaryDraft });
    setEditingSummary(false);
  };

  const handleAnalyze = async () => {
    if (!meeting || analyzing) return;
    setAnalyzing(true);
    try {
      await analyzeMeeting(meeting.id);
      await loadMeeting();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "AI analysis failed. Please try again.";
      alert(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTaskSave = async (updatedTask: ActionItem) => {
    if (!meeting) return;
    try {
      const plainData = {
        task: updatedTask.task,
        owner: updatedTask.owner || null,
        department: updatedTask.department || null,
        deadline: updatedTask.deadline || null,
        priority: updatedTask.priority
      };
      await updateTask(meeting.id, updatedTask.id!, plainData);
      setMeeting({
        ...meeting,
        action_items: meeting.action_items.map((t) => t.id === updatedTask.id ? { ...t, ...plainData } : t),
      });
    } catch {
      alert("Failed to update task.");
    }
  };

  const handleRemindAll = async () => {
    if (!meeting) return;
    const itemsWithOwners = meeting.action_items.filter((t) => t.owner);
    if (itemsWithOwners.length === 0) {
      alert('No tasks have assigned owners to remind.');
      return;
    }
    try {
      const recipients = itemsWithOwners.map((t) => ({
        name: t.owner || 'Team Member',
        email: t.owner_email || '',
        task: t.task,
        deadline: t.deadline || null,
        task_id: t.id || null,
      }));
      await sendReminder({
        meeting_id: meeting.id,
        meeting_title: meeting.title,
        summary: meeting.summary || null,
        decisions: meeting.decisions,
        recipients,
      });
      alert(`Reminders sent to ${recipients.length} team member(s)!`);
    } catch {
      alert('Failed to send reminders. Check SMTP config.');
    }
  };

  const handleResolveGap = async (gapId: string) => {
    if (!meeting) return;
    await resolveGap(meeting.id, gapId);
    setMeeting({
      ...meeting,
      gaps: meeting.gaps.map((g) => g.id === gapId ? { ...g, resolved: true } : g),
    });
  };

  const handleTaskCreated = async (data: any) => {
    if (!meeting) return;
    try {
      const payload = {
        task: data.task,
        owner: data.owner || null,
        department: data.department || null,
        deadline: data.deadline || null,
        deadline_type: data.deadline ? 'explicit' : null,
        priority: data.priority,
        confidence_score: 1.0,
        status: 'created',
      };
      const res = await createTask(meeting.id, payload);
      const newTask = { ...payload, id: res.id } as ActionItem;
      setMeeting({ ...meeting, action_items: [...meeting.action_items, newTask] });
      setShowAddTask(false);
    } catch {
      alert('Failed to create task');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F9F8F6] items-center justify-center rounded-2xl mx-[40px]" style={{ minHeight: '60vh' }}>
        <div className="bg-white rounded-2xl text-center shadow-sm border border-neutral-200" style={{ padding: '24px 36px' }}>
          <p className="text-neutral-500 font-semibold tracking-wide" style={{ paddingLeft: '10px' }}>Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="text-center text-neutral-400 mx-[40px]" style={{ padding: '60px 20px' }}>
        <p className="text-3xl" style={{ marginBottom: '10px' }}>😔</p>
        <p style={{ paddingLeft: '10px' }}>{error || 'Meeting not found'}</p>
      </div>
    );
  }

  const attentionItems: { id?: string; description: string; resolved: boolean; type: 'gap' | 'low_confidence' | 'ghost'; reason?: string }[] = [
    ...meeting.gaps.filter((g) => !g.resolved).map(g => ({ ...g, type: 'gap' as const, reason: undefined })),
    ...meeting.action_items
      .filter((t) => t.confidence_score < 0.6)
      .map((t) => ({ id: t.id, description: `Low confidence (${Math.round(t.confidence_score * 100)}%) on owner "${t.owner}" for: "${t.task}"`, resolved: false, type: 'low_confidence' as const, reason: undefined })),
    ...(meeting.ghost_tasks || []).map((t, i) => ({
      id: `ghost-${i}`,
      description: `Ghost Task Detected: ${t.description}`,
      reason: t.reason,
      resolved: false,
      type: 'ghost' as const
    })),
  ];

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'actions', label: `Action Items (${meeting.action_items.length})` },
    { id: 'decisions', label: `Decisions (${meeting.decisions.length})` },
    { id: 'attention', label: `Attention (${attentionItems.length})` },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-[40px]">
      {/* Symmetrical padding centers the content while guaranteeing a 40px left-side buffer */}

      {/* Modals */}
      {reminderTask && (
        <DialogStack
          isOpen={true}
          meeting={meeting}
          task={reminderTask}
          onClose={() => setReminderTask(null)}
          onSent={() => setTimeout(() => setReminderTask(null), 2000)}
        />
      )}
      <CreateModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onCreate={handleTaskCreated}
        mode="task"
        title="Add Task"
        description="Manually insert an action item missed by the AI analysis."
      />

      {/* Bomb Detector Banner */}
      {meeting.bomb_risks && meeting.bomb_risks.length > 0 && (
        <div className="bg-red-900 border border-red-700 rounded-3xl p-6 mb-6 mt-2 shadow-xl shadow-red-900/10 animate-fade-in flex items-start gap-4 text-white">
          <div className="text-3xl mt-1 opacity-90 animate-pulse">🧨</div>
          <div>
            <h3 className="font-extrabold text-[16px] uppercase tracking-widest text-red-100 mb-1">Unspoken Risk Detected</h3>
            <p className="font-bold text-[18px] leading-snug mb-2">{meeting.bomb_risks[0].description}</p>
            <p className="text-red-200 text-[14px] leading-relaxed">{meeting.bomb_risks[0].reason}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-in flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ marginBottom: '10px' }}>
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight" style={{ paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>{meeting.title}</h1>
          {meeting.created_at && (
            <p className="text-neutral-400 text-[13px] font-medium tracking-wide" style={{ paddingLeft: '10px', marginTop: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
              Created {new Date(meeting.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 pr-2">
          {/* Re-Meeting Risk Score */}
          {meeting.remeeting_risk_score !== undefined && meeting.remeeting_risk_score !== null && (
            <div className="group relative flex items-center justify-center bg-white border border-neutral-200 rounded-2xl p-3 shadow-sm cursor-help">
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[12px] font-bold p-2 rounded-lg w-48 text-center pointer-events-none z-10 shadow-lg">
                {meeting.remeeting_risk_reason || "Re-Meeting Risk"}
              </div>
              <div className={`text-xl font-black ${meeting.remeeting_risk_score > 60 ? 'text-red-500' : meeting.remeeting_risk_score > 30 ? 'text-amber-500' : 'text-green-500'}`}>
                {meeting.remeeting_risk_score}%
              </div>
              <div className="tracking-widest uppercase text-[9px] font-bold text-neutral-400 ml-3 mr-1 leading-none">
                Re-meeting<br />Risk
              </div>
            </div>
          )}

          {/* Run AI Analysis Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              padding: '12px 24px',
              borderRadius: '1rem',
              fontSize: '13px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.2)'
            }}
          >
            {analyzing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Run AI Analysis</span>
              </>
            )}
          </button>

          {/* Handoff Card Link */}
          <a
            href={`/handoff/${meeting.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
            style={{ padding: '12px 24px', borderRadius: '1rem', fontSize: '13px', fontWeight: 'bold' }}
          >
            <span>📎</span> Share Handoff
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="animate-fade-in-delay-1 overflow-x-auto w-full" style={{ marginBottom: '10px' }}>
        <ContinuousTabs tabs={tabs} defaultActiveId={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-delay-2 w-full">

        {/* ─── SUMMARY TAB ─── */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-2xl border border-neutral-300 shadow-sm" style={{ padding: '24px', marginTop: '10px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '10px' }}>
              <h2 className="font-bold text-[16px] text-neutral-800 tracking-wide" style={{ paddingLeft: '10px', minHeight: '38px', display: 'flex', alignItems: 'center' }}>Meeting Summary</h2>
              <button
                onClick={() => setEditingSummary(!editingSummary)}
                className="font-semibold rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors shadow-sm"
                style={{ padding: '10px 20px', fontSize: '13px', minHeight: '42px' }}
              >
                {editingSummary ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            {editingSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 text-black outline-none focus:border-black leading-relaxed text-[14px]"
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  style={{ padding: '16px', paddingLeft: '10px', minHeight: '260px' }}
                />
                <button
                  onClick={handleSaveSummary}
                  className="text-white self-end font-bold transition-colors shadow-md tracking-wider uppercase rounded-xl"
                  style={{ padding: '12px 28px', fontSize: '11px', minHeight: '44px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="text-neutral-600 leading-loose font-medium text-[15px]" style={{ paddingLeft: '10px' }}>
                {meeting.summary ? (
                  meeting.summary.split('\n').map((paragraph: string, idx: number) => (
                    <p key={idx} style={{ marginBottom: '10px', minHeight: '30px' }}>{paragraph}</p>
                  ))
                ) : <p style={{ minHeight: '30px' }}>No summary yet. Run analysis to generate.</p>}
              </div>
            )}
          </div>
        )}

        {/* ─── ACTION ITEMS TAB ─── */}
        {activeTab === 'actions' && (
          <div className="w-full" style={{ marginTop: '10px' }}>
            <div className="flex justify-end" style={{ marginBottom: '10px' }}>
              <button
                onClick={() => setShowAddTask(true)}
                className="text-white rounded-[5rem] tracking-wider uppercase font-bold flex items-center transition-colors active:scale-95 shadow-lg"
                style={{ padding: '15px 28px', gap: '8px', fontSize: '11px', minHeight: '50px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
              >
                <span style={{ fontSize: '16px' }}>➕</span>
                <span style={{ fontSize: '11px' }}>Add Task</span>
                <span style={{ fontSize: '8px', color: 'black' }}>.</span>
              </button>
            </div>

            {meeting.action_items.length === 0 ? (
              <div className="bg-white rounded-2xl text-center text-neutral-400 border border-neutral-300 font-medium tracking-wide shadow-sm flex flex-col items-center" style={{ padding: '40px', gap: '10px' }}>
                <p className="text-[14px]" style={{ paddingLeft: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>No action items yet. Add one manually.</p>
              </div>
            ) : (
              <InlineTableControl
                data={meeting.action_items}
                onUpdate={handleTaskSave}
                onSendReminder={(task) => setReminderTask(task)}
                onRemindAll={handleRemindAll}
              />
            )}
          </div>
        )}

        {/* ─── DECISIONS TAB ─── */}
        {activeTab === 'decisions' && (
          <div className="w-full" style={{ marginTop: '20px' }}>
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="font-extrabold text-xl text-neutral-900 tracking-tight flex items-center gap-2">
                <span className="text-2xl">⚖️</span> Decisions Made
              </h2>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm">
                {meeting.decisions.length} Total
              </span>
            </div>

            {meeting.decisions.length === 0 ? (
              <div className="bg-white rounded-3xl text-center text-neutral-400 border border-neutral-200 font-medium tracking-wide shadow-sm flex flex-col items-center" style={{ padding: '60px 20px', gap: '12px' }}>
                <span className="text-5xl block opacity-50">🤔</span>
                <p className="text-[15px] text-neutral-500 mt-2">No decisions were extracted from this meeting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {meeting.decisions.map((d, i) => {
                  const isString = typeof d === 'string';
                  const decisionText = isString ? d : d.decision;
                  const confidence = isString ? 'medium' : d.confidence;
                  const reasoning = isString ? null : d.reasoning;
                  const excerpt = isString ? null : d.transcript_excerpt;

                  // Dynamic styles based on AI confidence
                  const confColors: Record<string, string> = {
                    high: 'bg-emerald-500',
                    medium: 'bg-amber-500',
                    low: 'bg-red-500'
                  };
                  const badgeStyles: Record<string, string> = {
                    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    medium: 'bg-amber-50 text-amber-700 border-amber-200',
                    low: 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  };

                  const activeColor = confColors[confidence] || confColors.medium;
                  const activeBadge = badgeStyles[confidence] || badgeStyles.medium;

                  return (
                    <div key={i} className="relative bg-white border border-neutral-200 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden h-full group">

                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${activeColor} opacity-70 group-hover:opacity-100 transition-opacity`} />

                      {/* Hardcoded huge padding to absolutely guarantee text stays far from the edges */}
                      <div style={{ padding: '40px 40px 40px 52px' }} className="flex flex-col flex-1">

                        {/* Header: Number & Confidence */}
                        {/* Increased mb-6 to mb-8 for more space under the header */}
                        <div className="flex justify-between items-center mb-8">
                          <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                            Decision {i + 1}
                          </span>
                          {!isString && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm ${activeBadge}`}>
                              {confidence === 'high' ? '✅ High' : confidence === 'medium' ? '⚠️ Medium' : '❌ Soft'}
                            </span>
                          )}
                        </div>

                        {/* Main Decision Text */}
                        {/* Increased mb-8 to mb-12 for more space before the AI reasoning block */}
                        <p className="text-neutral-900 font-bold text-[15.5px] leading-relaxed mb-12">
                          {decisionText}
                        </p>

                        {/* Bottom Blocks: Uses mt-auto to push to bottom */}
                        <div className="mt-auto flex flex-col gap-4">

                          {reasoning && (
                            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/60">
                              <div className="flex items-start gap-3">
                                <span className="text-[18px] opacity-80">🧠</span>
                                <div>
                                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                                    AI Reasoning
                                  </span>
                                  <p className="text-[13px] text-neutral-600 font-medium leading-relaxed">
                                    {reasoning}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {excerpt && (
                            <div className="mt-2">
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                                💬 Transcript Quote
                              </span>
                              {/* Classic blockquote styling: left border, slight indent */}
                              <p className="text-[13px] text-neutral-600 font-medium leading-relaxed italic border-l-2 border-neutral-200 pl-3">
                                "{excerpt}"
                              </p>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ATTENTION NEEDED TAB ─── */}
        {activeTab === 'attention' && (
          <div style={{ marginTop: '10px' }}>
            {attentionItems.length === 0 ? (
              <div className="bg-white rounded-2xl text-center text-neutral-500 border border-neutral-300 shadow-sm flex flex-col items-center" style={{ padding: '40px', gap: '10px' }}>
                <span className="text-4xl block" style={{ minHeight: '50px' }}>✅</span>
                <p className="font-semibold text-lg tracking-wide" style={{ paddingLeft: '10px', minHeight: '36px', display: 'flex', alignItems: 'center' }}>All clear! Nothing needs attention.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {attentionItems.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-red-50 border border-red-200 rounded-xl shadow-sm" style={{ padding: '18px', gap: '10px' }}>
                    <div className="flex items-start sm:items-center" style={{ gap: '10px' }}>
                      <span className="text-red-500 text-xl font-bold">
                        {item.type === 'ghost' ? '👻' : '⚠️'}
                      </span>
                      <div>
                        <p className="font-semibold text-red-900 text-[14px] leading-relaxed" style={{ paddingLeft: '10px', display: 'flex', alignItems: 'center' }}>
                          {item.description}
                        </p>
                        {item.type === 'ghost' && item.reason && (
                          <p className="text-red-700 text-[12px] italic mt-1 ml-2.5 max-w-xl">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    {!item.resolved && item.type === 'gap' && (
                      <button
                        onClick={() => handleResolveGap(item.id!)}
                        className="bg-white border border-red-200 rounded-xl text-red-600 font-bold uppercase tracking-wider hover:bg-red-50 transition-colors shrink-0 shadow-sm"
                        style={{ padding: '10px 22px', fontSize: '12px', minHeight: '42px' }}
                      >
                        Mark Active
                      </button>
                    )}
                    {item.type === 'ghost' && (
                      <button
                        onClick={() => {
                          // Pre-fill the create task modal
                          setShowAddTask(true);
                        }}
                        className="bg-red-600 border border-red-500 rounded-xl text-white font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shrink-0 shadow-sm"
                        style={{ padding: '10px 22px', fontSize: '12px', minHeight: '42px' }}
                      >
                        Assign Task
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}