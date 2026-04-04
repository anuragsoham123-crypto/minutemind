'use client';

import { useEffect, useState } from 'react';
import { getWorkload } from '@/lib/api';
import { WorkloadReport, MemberWorkload } from '@/lib/types';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Clock, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkloadPage() {
  const [report, setReport] = useState<WorkloadReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkload();
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
        <p className="text-neutral-500 font-medium animate-pulse">Scanning team task distribution...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-2" />
        <h3 className="text-lg font-bold">Unable to load workload data</h3>
        <p className="text-neutral-500">Please try again later or contact your administrator.</p>
      </div>
    );
  }

  const sortedMembers = [...(report.members || [])].sort((a, b) => b.load_score - a.load_score);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 min-h-[calc(100vh-48px)] flex flex-col justify-center">
      {/* Header */}
      <div className="mb-16 text-center">
        <div className="flex flex-col items-center justify-center gap-3 mb-[34px]">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
            <BarChart3 size={24} />
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Workload Radar</h1>
        </div>
        <p className="text-neutral-500 font-medium max-w-4xl mx-auto">
          Visualizing task density across your entire organization. This radar detects overloaded individuals and departments creating bottlenecks.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Load Scores */}
        <div className="bg-white rounded-3xl border border-neutral-200" style={{ padding: '36px' }}>
            <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> Member Workload
            </h2>
            
            <div className="space-y-8">
              {sortedMembers.map((member, i) => (
                <motion.div 
                  key={member.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-neutral-800">{member.name}</h3>
                      <p className="text-[12px] text-neutral-400 font-medium uppercase tracking-wider">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                        member.load_score > 0.8 ? 'bg-red-50 text-red-600 border-red-100' :
                        member.load_score > 0.4 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {Math.round(member.load_score * 100)}% Load
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="relative h-4 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${member.load_score * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        member.load_score > 0.8 ? 'bg-red-500' :
                        member.load_score > 0.4 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>
                  
                  <div className="flex gap-4 text-[11px] font-bold text-neutral-400 tracking-wide pt-1">
                      <div className="flex items-center gap-1">
                      {member.completed} Completed
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" /> {member.in_progress} In Progress
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-red-500" /> {member.overdue} Overdue
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        {/* Bottlenecks Card */}
        <div className="bg-white rounded-3xl border border-neutral-200" style={{ padding: '36px' }}>
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> Bottleneck Alert
          </h2>
            
            {report?.bottleneck_departments && report?.bottleneck_departments.length ? (
              <div className="space-y-4">
                {report.bottleneck_departments.map(dept => (
                  <div key={dept} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle size={16} />
                    </div>
                    <span className="font-bold text-red-900 text-[14px]">{dept} Dept</span>
                  </div>
                ))}
                <p className="text-[13px] text-neutral-500 mt-4 leading-relaxed italic">
                  Departments listed here have more than 10 active tasks creating organizational drag.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-400 font-medium">No major bottlenecks detected across departments.</p>
              </div>
            )}
        </div>

      </div>

      <p className="text-center text-neutral-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-12 pb-12">
        Workload Synchronized: {new Date(report.generated_at).toLocaleString()}
      </p>
    </div>
  );
}
