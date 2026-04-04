'use client';

import { useEffect, useState } from 'react';
import { getMyTasks, updateMyTaskStatus } from '@/lib/api';
import type { MyTask } from '@/lib/types';

const STATUS_OPTIONS = [
  { value: 'created', label: 'Created', color: '#94a3b8' },
  { value: 'assigned', label: 'Assigned', color: '#0ea5e9' },
  { value: 'in_progress', label: 'In Progress', color: '#d97706' },
  { value: 'completed', label: 'Completed', color: '#16a34a' },
  { value: 'overdue', label: 'Overdue', color: '#dc2626' },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(220,38,38,0.1)', text: '#dc2626' },
  medium: { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
  low: { bg: 'rgba(22,163,74,0.1)', text: '#16a34a' },
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTasks = () => {
    getMyTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTasks(); }, []);

  const handleStatusChange = async (task: MyTask, newStatus: string) => {
    if (!task.meeting_id || !task.id) return;
    setUpdatingId(task.id);
    try {
      await updateMyTaskStatus(task.meeting_id, task.id, newStatus);
      setTasks(prev => prev.map(t =>
        t.id === task.id && t.meeting_id === task.meeting_id
          ? { ...t, status: newStatus }
          : t
      ));
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ paddingLeft: '10px', color: 'var(--text-primary)' }}>My Tasks</h1>
        <p className="font-medium text-[13px]" style={{ paddingLeft: '10px', color: 'var(--text-muted)' }}>Tasks assigned to you across all meetings</p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap" style={{ gap: '8px', marginBottom: '10px', paddingLeft: '10px' }}>
        {['all', ...STATUS_OPTIONS.map(s => s.value)].map(f => {
          const isActive = filter === f;
          const opt = STATUS_OPTIONS.find(s => s.value === f);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full font-bold text-[11px] uppercase tracking-wider transition-all"
              style={{
                padding: '8px 18px',
                background: isActive ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' : 'var(--bg-card)',
                color: isActive ? '#fff' : (opt?.color || 'var(--text-secondary)'),
                border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {f === 'all' ? `All (${tasks.length})` : `${opt?.label || f} (${tasks.filter(t => t.status === f).length})`}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl text-center border shadow-sm flex flex-col items-center" style={{ padding: '40px', gap: '10px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-4xl">📌</span>
          <p className="font-medium text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {tasks.length === 0 ? 'No tasks assigned to you yet.' : 'No tasks match this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((task, i) => {
            const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];
            const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            const isUpdating = updatingId === task.id;

            return (
              <div
                key={`${task.meeting_id}-${task.id}-${i}`}
                className="rounded-2xl border shadow-sm transition-all"
                style={{ padding: '20px', background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '10px' }}>
                  {/* Task info */}
                  <div className="flex-1" style={{ paddingLeft: '10px' }}>
                    <h3 className="font-bold text-[15px]" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>{task.task}</h3>
                    <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
                      {/* Meeting title */}
                      <span className="text-[11px] font-bold rounded-full" style={{ padding: '4px 12px', background: 'rgba(56,189,248,0.08)', color: '#0ea5e9' }}>
                        📋 {task.meeting_title || 'Unknown Meeting'}
                      </span>
                      {/* Priority */}
                      <span className="text-[11px] font-bold uppercase tracking-wider rounded-full" style={{ padding: '4px 12px', background: priorityColor.bg, color: priorityColor.text }}>
                        {task.priority}
                      </span>
                      {/* Deadline */}
                      {task.deadline && (
                        <span className="text-[11px] font-medium rounded-full" style={{ padding: '4px 12px', background: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}>
                          📅 {task.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      disabled={isUpdating}
                      className="rounded-xl font-bold text-[12px] uppercase tracking-wider border outline-none cursor-pointer transition-colors"
                      style={{
                        padding: '10px 16px',
                        background: 'var(--bg-card-hover)',
                        borderColor: statusOpt.color,
                        color: statusOpt.color,
                        minWidth: '140px',
                        opacity: isUpdating ? 0.5 : 1,
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
