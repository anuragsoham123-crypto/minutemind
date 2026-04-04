'use client';

import { useEffect, useState } from 'react';
import { listTasks, updateTask } from '@/lib/api';
import type { ActionItem } from '@/lib/types';
import { InlineTableControl } from '@/components/ui/InlineTableControl';
import { ContinuousTabs } from '@/components/ui/ContinuousTabs';

const statusOptions = ['all', 'created', 'assigned', 'in_progress', 'completed', 'overdue'];
const statusLabels: Record<string, string> = {
  all: 'All',
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<(ActionItem & { meeting_id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleTaskSave = async (updatedTask: ActionItem) => {
    if (!updatedTask.meeting_id) return;
    try {
      const plainData = {
        task: updatedTask.task,
        owner: updatedTask.owner || null,
        department: updatedTask.department || null,
        deadline: updatedTask.deadline || null,
        priority: updatedTask.priority,
      };
      await updateTask(updatedTask.meeting_id, updatedTask.id!, plainData);
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...plainData } : t))
      );
    } catch {
      alert("Failed to update task.");
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const filterTabs = statusOptions.map((s) => ({
    id: s,
    label: `${statusLabels[s]} (${s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length})`,
  }));

  if (loading) {
    return (
      <div className="flex bg-[#F9F8F6] items-center justify-center rounded-2xl mx-[40px]" style={{ minHeight: '60vh' }}>
        <div className="bg-white rounded-2xl text-center shadow-sm border border-neutral-200" style={{ padding: '24px 36px' }}>
          <p className="text-neutral-500 font-semibold tracking-wide" style={{ paddingLeft: '10px' }}>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    // Applied the consistent layout sizing from the Meetings page!
    <div className="w-[calc(100%-10px)] max-w-7xl mx-auto px-[40px]">

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '10px' }}>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight" style={{ paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>My Tasks</h1>
        <p className="text-neutral-400 font-medium text-[13px]" style={{ paddingLeft: '10px', marginTop: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
          All action items across your meetings
        </p>
      </div>

      {/* Filters using ContinuousTabs */}
      {/* ADDED: overflow-x-auto to parent, w-max min-w-full to ContinuousTabs, and whitespace-nowrap to the buttons */}
      <div className="animate-fade-in-delay-1 overflow-x-auto hide-scrollbar" style={{ marginBottom: '10px', paddingBottom: '4px' }}>
        <ContinuousTabs
          tabs={filterTabs}
          defaultActiveId={filter}
          onChange={setFilter}
          layoutGroupId="tasks-filter"
          className="w-max min-w-full gap-[10px] p-2"
          tabClassName="!py-4 sm:!py-5 whitespace-nowrap text-center px-6"
        />
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl text-center border border-neutral-300 shadow-sm animate-fade-in flex flex-col items-center" style={{ padding: '40px', gap: '10px' }}>
          <span className="text-4xl block" style={{ minHeight: '50px' }}>📋</span>
          <p className="text-neutral-500 font-medium text-[14px]" style={{ paddingLeft: '10px' }}>
            {filter === 'all' ? 'No tasks yet. Analyze a meeting to get started!' : `No ${statusLabels[filter].toLowerCase()} tasks`}
          </p>
        </div>
      ) : (
        <div className="animate-fade-in-delay-2 w-full flex justify-center">
          <div className="w-[100%] max-w-full">
            <InlineTableControl
              data={filteredTasks as ActionItem[]}
              onUpdate={handleTaskSave}
              onSendReminder={() => alert('Sending reminders from global tasks list is not implemented yet. Please go to the specific meeting.')}
            />
          </div>
        </div>
      )}
    </div>
  );
}