"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  title: string;
  description: string;
  initialData?: any;
  mode: 'meeting' | 'task';
  loading?: boolean;
}

export const CreateModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  title,
  description,
  initialData,
  mode,
  loading = false
}) => {
  const [name, setName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [owner, setOwner] = useState('');
  const [department, setDepartment] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    if (isOpen) {
      if (initialData?.title) setName(initialData.title);
      if (initialData?.task) setName(initialData.task);
      setTranscript('');
      setAudioFile(null);
      setOwner('');
      setDepartment('');
      setDeadline('');
      setPriority('medium');
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (mode === 'meeting') {
      onCreate({ title: name, transcript, audio: audioFile, ...initialData });
    } else {
      onCreate({
        task: name,
        owner,
        department,
        deadline,
        priority,
        ...initialData
      });
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">

          {/* BG Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.4 }
            }}
            className="relative w-full max-w-2xl backdrop-blur-2xl rounded-2xl shadow-2xl z-50 my-auto bg-white border-[6px] sm:border-[10px] border-[#F2F2F2]"
            style={{ padding: '28px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-gray-900" style={{ paddingLeft: '10px', minHeight: '38px', display: 'flex', alignItems: 'center' }}>{title}</h2>
                <p className="text-[13px] leading-relaxed text-gray-500" style={{ paddingLeft: '10px', marginTop: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                  {description}
                </p>
              </div>
              <button title="close"
                onClick={onClose}
                className="transition-colors text-gray-400 hover:text-gray-600"
                style={{ padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Input Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Title / Task input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>
                  {mode === 'meeting' ? 'Meeting Title' : 'Task Description'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-500"
                  style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                />
              </div>

              {mode === 'meeting' && (
                <>
                  {/* Transcript */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Transcript (Text)</label>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={6}
                      placeholder="Paste your meeting notes or transcript here..."
                      className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-500 resize-y"
                      style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '160px' }}
                    />
                  </div>

                  {/* Audio Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Audio Upload (Optional)</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 text-gray-700
                                 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                                 file:text-[12px] file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition-all cursor-pointer"
                      style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                    />
                  </div>
                </>
              )}

              {mode === 'task' && (
                <>
                  <div className="grid grid-cols-2" style={{ gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Owner</label>
                      <input
                        type="text"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-300"
                        style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-300"
                        style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Deadline</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-300"
                        style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-xl outline-none transition-all bg-gray-50 border border-gray-200 text-gray-900 focus:border-gray-300 bg-transparent"
                        style={{ padding: '14px 18px', paddingLeft: '10px', minHeight: '50px' }}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end" style={{ gap: '10px', marginTop: '24px' }}>
              <button
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl font-bold transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50"
                style={{ padding: '14px 28px', fontSize: '13px', minHeight: '50px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !name}
                className="w-full sm:w-auto rounded-xl font-bold transition-all active:scale-95 text-white disabled:opacity-50"
                style={{ padding: '14px 28px', fontSize: '13px', minHeight: '50px', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}
              >
                {loading ? 'Processing...' : (mode === 'meeting' ? 'Create Meeting' : 'Add Task')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
