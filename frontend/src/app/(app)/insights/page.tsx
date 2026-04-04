'use client';

import { useEffect, useState } from 'react';
import { getInsights } from '@/lib/api';
import { PatternReport, PatternInsight } from '@/lib/types';
import {
  AlertTriangle,
  RefreshCcw,
  Hourglass,
  Users,
  CloudRain,
  Info,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const insightIcons: Record<string, any> = {
  recurring_topic: RefreshCcw,
  stuck_task: Hourglass,
  overloaded_member: Users,
  underutilized_member: TrendingDown,
  soft_decision_pattern: CloudRain,
};

const severityColors: Record<string, string> = {
  info: 'bg-blue-50 text-blue-600 border-blue-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
};

export default function InsightsPage() {
  const [report, setReport] = useState<PatternReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getInsights();
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium animate-pulse">Scanning meeting DNA for patterns...</p>
      </div>
    );
  }

  const sortedInsights = [...(report?.insights || [])].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-8 min-h-[calc(100vh-48px)] flex flex-col justify-center">
      {/* Header */}
      <div className="mb-16 px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
            <Info size={24} />
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight" style={{ marginBottom: '30px' }}>Meeting DNA</h1>
        </div>
        <p className="text-neutral-500 font-medium leading-relaxed" style={{ marginTop: '10px' }}>
          MinuteMind analyzed your last 10 meetings to detect recurring circular debates, workload bottlenecks, and organizational health signals.
        </p>
      </div>

      {!sortedInsights.length ? (
        <div
          className="bg-white rounded-3xl border border-neutral-200 px-12 text-center shadow-sm mx-4 flex flex-col items-center justify-center"
          style={{ paddingTop: '63px', paddingBottom: '58px' }}
        >
          <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-300 mx-auto mb-4">
            <RefreshCcw size={32} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-3">No patterns detected yet</h3>
          <p className="text-neutral-500 max-w-sm mx-auto text-center">
            Patterns emerge after you've analyzed at least 3-4 meetings with consistent team members and topics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
          <AnimatePresence>
            {sortedInsights.map((insight, i) => {
              const Icon = insightIcons[insight.type] || Info;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden"
                  style={{ padding: '32px', minHeight: '280px' }}
                >
                  {/* Severity Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${severityColors[insight.severity]}`}>
                      {insight.severity}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 mb-3">{insight.title}</h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed mb-10">
                    {insight.description}
                  </p>

                  <div
                    className="mt-auto pt-10 border-t border-neutral-50 flex items-center justify-between cursor-pointer group/button"
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  >
                    <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider group-hover/button:text-blue-500 transition-colors">
                      Pattern Intelligence
                    </span>
                    <button className="text-blue-500 hover:text-blue-600 transition-colors">
                      <ChevronRight size={20} className={`transition-transform duration-300 ${expandedIndex === i ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedIndex === i && insight.data?.uncompleted_tasks && insight.data.uncompleted_tasks.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-neutral-100 mt-6 pt-6"
                      >
                        <h4 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-amber-500" /> Associated Uncompleted Items
                        </h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                          {insight.data.uncompleted_tasks.map((task: any, idx: number) => (
                            <div key={idx} className="bg-neutral-50/80 rounded-xl p-4 border border-neutral-100 flex items-start gap-4">
                              <div className="mt-1 shrink-0">
                                <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-[14px] font-bold text-neutral-900 leading-snug">{task.task}</p>
                                {task.owner && <p className="text-[11px] text-neutral-500 font-bold mt-1.5 uppercase tracking-wider">Owner: {task.owner}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {expandedIndex === i && (!insight.data?.uncompleted_tasks || insight.data.uncompleted_tasks.length === 0) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-neutral-100 mt-6 pt-6"
                      >
                        <p className="text-sm text-neutral-500 italic">No directly associated uncompleted tasks found.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Decorative background element */}
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-neutral-900 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={120} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {report && (
        <p className="text-center text-neutral-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-[58px]">
          Report Generated: {new Date(report.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
