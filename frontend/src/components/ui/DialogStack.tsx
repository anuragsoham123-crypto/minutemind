'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ThumbsUp } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ActionItem, Meeting, ReminderRecipient } from '@/lib/types';
import { sendReminder } from '@/lib/api';

interface DialogStackProps {
  meeting: Meeting;
  task: ActionItem;
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

export const DialogStack: React.FC<DialogStackProps> = ({ meeting, task, isOpen, onClose, onSent }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Form state
  const [name, setName] = useState(task.owner || '');
  const [email, setEmail] = useState(task.owner_email || '');
  const [taskText, setTaskText] = useState(task.task);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setName(task.owner || '');
      setEmail(task.owner_email || '');
      setTaskText(task.task);
    }
  }, [isOpen, task]);

  const handleNext = () => {
    if (activeIndex < 1) setActiveIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => setActiveIndex(0), 300);
  };

  const submitReminder = async () => {
    if (!email) return;
    setSending(true);
    try {
      const recipient: ReminderRecipient = {
        name: name || 'Team Member',
        email,
        task: taskText,
        deadline: task.deadline || null,
        task_id: task.id || null,
      };
      await sendReminder({
        meeting_id: meeting.id,
        meeting_title: meeting.title,
        summary: meeting.summary || null,
        decisions: meeting.decisions,
        recipients: [recipient],
      });
      // Move to success step (step index 1)
      setActiveIndex(1);
    } catch {
      alert("Failed to send reminder. Check server logs and SMTP config.");
    } finally {
      setSending(false);
    }
  };

  const stack = [
    {
      id: 'step1',
      title: 'Send Reminder Email',
      type: 'form' as const,
    },
    {
      id: 'step2',
      title: 'Success!',
      type: 'steps' as const,
      steps: [
        { icon: 'mail-01' as any, text: `Reminder sent to ${email}` },
        { icon: 'check-list' as any, text: `Included: Meeting summary & decisions` },
        { icon: 'notification-01' as any, text: `Owner will be held accountable.` },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 1, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ ease: 'easeOut', duration: 0.25 }}
          className="fixed inset-0 z-[100] flex justify-center items-center pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto"
          />

          <div className="relative flex min-h-[450px] w-full max-w-[400px] items-center justify-center p-4 pointer-events-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              {stack.map((item, index) => {
                const isUnder = index < activeIndex;
                if (index > activeIndex) return null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{
                      y: isUnder ? -35 : 0,
                      scale: isUnder ? 0.94 : 1,
                      opacity: isUnder ? 0.5 : 1,
                      zIndex: index,
                    }}
                    exit={{ y: 50, opacity: 0, scale: 0.95 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 28,
                    }}
                    className="absolute inset-x-4 sm:inset-x-0 top-1/2 -mt-[250px] flex h-fit flex-col overflow-hidden rounded-[20px] border-[1.6px] border-neutral-200 bg-white shadow-2xl transition-colors sm:rounded-[24px]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-[1.5px] border-neutral-100 bg-[#FAFAFA] px-4 py-2.5 sm:px-5 sm:py-3">
                      <h3 className="text-base font-medium text-neutral-600 sm:text-lg">
                        {item.title}
                      </h3>
                      <button
                        title="close"
                        onClick={index === 0 ? resetAndClose : undefined}
                        className="rounded-full p-1 transition-colors hover:bg-neutral-100"
                      >
                        {index === 0 ? <X size={20} className="text-neutral-500 sm:size-[22px]" /> : null}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 px-5 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10 bg-white">
                      {item.type === 'form' ? (
                        <div className="space-y-4 sm:space-y-5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-neutral-600">Name</label>
                              <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-lg border-[1.5px] border-neutral-200 bg-neutral-50 p-2.5 text-black outline-none focus:border-black" />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-neutral-600">Email Address</label>
                              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-lg border-[1.5px] border-neutral-200 bg-neutral-50 p-2.5 text-black outline-none focus:border-black" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-neutral-600">Task Summary</label>
                            <textarea rows={3} value={taskText} onChange={(e)=>setTaskText(e.target.value)} className="w-full rounded-lg border-[1.5px] border-neutral-200 bg-neutral-50 p-2.5 text-black outline-none focus:border-black" />
                          </div>

                          <button onClick={submitReminder} disabled={!email || sending} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-colors active:scale-[0.98] sm:rounded-2xl sm:py-4 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
                            {sending ? 'Sending...' : 'Send Reminder'} <ArrowRight size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6 sm:space-y-8">
                          <h4 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                            All Set!
                          </h4>

                          <div className="space-y-5 sm:space-y-6">
                            {item.steps?.map((step, i) => (
                              <div key={i} className="group flex items-start gap-3 sm:gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-[#F5F1EB] text-neutral-800 transition-colors sm:h-12 sm:w-12 sm:rounded-xl">
                                  <HugeiconsIcon icon={step.icon} size={22} strokeWidth={1.5} />
                                </div>
                                <p className="pt-0.5 text-sm leading-snug text-neutral-700 sm:pt-1 sm:text-base font-medium">
                                  {step.text}
                                </p>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => { onSent(); resetAndClose(); }}
                            className="flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] sm:gap-4 sm:rounded-2xl sm:py-4 sm:text-lg"
                            style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
                          >
                            Done <ThumbsUp size={20} className="sm:size-[22px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
