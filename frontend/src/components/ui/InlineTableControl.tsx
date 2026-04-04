'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Pencil, X, Check, Mail, Send } from 'lucide-react';
import type { ActionItem } from '@/lib/types';

interface InlineTableControlProps {
  data: ActionItem[];
  onUpdate?: (item: ActionItem) => void;
  onSendReminder?: (item: ActionItem) => void;
  onRemindAll?: () => void;
  className?: string;
}

export const InlineTableControl: React.FC<InlineTableControlProps> = ({
  data,
  onUpdate,
  onSendReminder,
  onRemindAll,
  className = '',
}) => {
  const [items, setItems] = useState<ActionItem[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ActionItem | null>(null);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const handleDone = () => {
    if (editValues) {
      onUpdate?.(editValues);
      setEditingId(null);
      setEditValues(null);
    }
  };

  const layoutTransition = {
    type: 'spring' as const,
    bounce: 0,
    duration: 0.7,
  };

  return (
    <div className={`flex w-full flex-col justify-center select-none ${className}`}>
      <div className="w-full">
        {/* Remind All button */}
        {onRemindAll && data.length > 0 && (
          <div className="flex justify-end" style={{ marginBottom: '10px' }}>
            <button
              onClick={onRemindAll}
              className="flex items-center font-bold text-[12px] uppercase tracking-wider rounded-xl transition-colors active:scale-95 hover:opacity-80"
              style={{
                padding: '12px 22px',
                gap: '8px',
                background: 'var(--accent-start)',
                color: 'var(--bg-card)',
                minHeight: '44px',
              }}
            >
              <Send size={14} />
              Remind All
            </button>
          </div>
        )}
        <motion.div
          layout
          transition={layoutTransition}
          className={`hidden grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_100px] px-6 py-4 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 sm:grid ${editingId ? 'opacity-20 blur-[1px]' : 'opacity-100'} text-neutral-400`}
          style={{ marginBottom: '10px' }}
        >
          <motion.div layout>Task</motion.div>
          <motion.div layout>Owner</motion.div>
          <motion.div layout>Department</motion.div>
          <motion.div layout>Deadline</motion.div>
          <motion.div layout>Priority</motion.div>
          <motion.div layout>Actions</motion.div>
        </motion.div>

        <LayoutGroup>
          <div className="flex flex-col gap-[10px] sm:gap-[10px]">
            {items.map((item) => (
              <div key={item.id} className="relative">
                {!editingId && (
                  <motion.div
                    layoutId={`divider-${item.id}`}
                    className="mx-6 hidden h-px bg-neutral-100 sm:block"
                  />
                )}

                <AnimatePresence mode="popLayout">
                  {editingId === item.id ? (
                    <motion.div
                      layoutId={`container-${item.id}`}
                      transition={layoutTransition}
                      className="relative z-20 my-2 rounded-2xl border-[1.4px] border-r-0 border-l-0 border-neutral-200 bg-white p-4 shadow-xl sm:my-4 sm:rounded-none sm:p-8 sm:py-4 sm:shadow-none"
                    >
                      <motion.div className="space-y-4 sm:space-y-5">
                        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[120px_1fr] sm:items-center sm:gap-0">
                          <label className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">Task</label>
                          <input type="text" value={editValues?.task || ''} onChange={(e) => setEditValues(v => v ? {...v, task: e.target.value} : null)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[120px_1fr] sm:items-center sm:gap-0">
                          <label className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">Owner</label>
                          <input type="text" value={editValues?.owner || ''} onChange={(e) => setEditValues(v => v ? {...v, owner: e.target.value} : null)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[120px_1fr] sm:items-center sm:gap-0">
                          <label className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">Department</label>
                          <input type="text" value={editValues?.department || ''} onChange={(e) => setEditValues(v => v ? {...v, department: e.target.value} : null)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[120px_1fr] sm:items-center sm:gap-0">
                          <label className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">Deadline</label>
                          <input type="date" value={editValues?.deadline || ''} onChange={(e) => setEditValues(v => v ? {...v, deadline: e.target.value} : null)} className="w-full text-neutral-500 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[120px_1fr] sm:items-center sm:gap-0">
                          <label className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-neutral-400 uppercase">Priority</label>
                          <select value={editValues?.priority || 'medium'} onChange={(e) => setEditValues(v => v ? {...v, priority: e.target.value as any} : null)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm focus:border-black outline-none">
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </motion.div>

                      <div className="mt-6 flex flex-row justify-end gap-2 sm:mt-4">
                        <button
                          onClick={() => { setEditingId(null); setEditValues(null); }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-bold text-neutral-600 sm:flex-none sm:py-2 hover:bg-neutral-200"
                        >
                          <X size={18} /> <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleDone}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white sm:flex-none sm:py-2 hover:bg-black"
                        >
                          <Check size={18} /> <span>Done</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      layout="position"
                      layoutId={`container-${item.id}`}
                      transition={layoutTransition}
                      animate={{
                        opacity: editingId ? 0.35 : 1,
                        filter: editingId ? 'blur(1px)' : 'blur(0px)',
                      }}
                      className={`group grid cursor-default grid-cols-[1fr_auto_40px] items-center rounded-2xl px-4 py-4 transition-all duration-300 sm:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_1fr_100px] sm:rounded-none sm:px-6 sm:py-5 ${
                        editingId ? '' : 'border border-neutral-100 bg-neutral-50/50 opacity-100 hover:bg-neutral-50 sm:border-none sm:bg-transparent'
                      }`}
                    >
                      <motion.div className="flex flex-col pr-4">
                        <span className="text-[13.5px] font-semibold text-neutral-900">{item.task}</span>
                        {item.commitment_type && item.commitment_type !== 'unclear' && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span 
                              className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                item.commitment_type === 'verbal_commitment' ? 'text-blue-600' :
                                item.commitment_type === 'assignment' ? 'text-purple-600' :
                                'text-green-600'
                              }`}
                              title={item.transcript_excerpt || undefined}
                            >
                              {item.commitment_type === 'verbal_commitment' ? '🎤 Verbal' : 
                               item.commitment_type === 'assignment' ? '📋 Assigned' : 
                               '🙋 Volunteered'}
                            </span>
                            {item.transcript_excerpt && (
                              <span className="text-[10px] text-neutral-400 italic truncate max-w-[200px]" title={item.transcript_excerpt}>
                                "{item.transcript_excerpt}"
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>

                      <motion.div className="hidden sm:flex flex-col">
                         <span className={`text-[13px] font-medium ${item.owner ? 'text-neutral-700' : 'text-neutral-400 italic'}`}>
                           {item.owner || 'Unassigned'}
                         </span>
                         {item.confidence_score < 0.6 && (
                           <span className="text-[10px] text-red-500 font-bold">Low Confidence</span>
                         )}
                      </motion.div>
                      
                      <motion.div className="hidden sm:flex">
                        <span className={`text-[13px] font-medium ${item.department ? 'text-neutral-500' : 'text-neutral-400 italic'}`}>
                          {item.department || '—'}
                        </span>
                      </motion.div>

                      <motion.div className="hidden sm:flex flex-col">
                        <span className={`text-[13px] font-medium ${item.deadline ? 'text-neutral-700' : 'text-neutral-400 italic'}`}>
                          {item.deadline || 'None'}
                        </span>
                        {item.deadline_type === 'inferred' && (
                          <span className="text-[10px] text-orange-500 font-bold">Inferred</span>
                        )}
                      </motion.div>

                      <motion.div className="hidden sm:flex">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          item.priority === 'high' ? 'text-red-700' :
                          item.priority === 'medium' ? 'text-orange-700' :
                          'text-green-700'
                        }`}>
                          {item.priority}
                        </span>
                      </motion.div>

                      <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Remind"
                          onClick={() => onSendReminder?.(item)}
                          className="flex justify-center text-neutral-400 transition-transform hover:text-blue-600 active:scale-125"
                        >
                          <Mail size={18} strokeWidth={2.5} />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => {
                            setEditValues({ ...item });
                            setEditingId(item.id || null);
                          }}
                          className="flex justify-center text-neutral-400 transition-transform hover:text-black active:scale-125"
                        >
                          <Pencil size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
};
