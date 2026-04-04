'use client';

import { useEffect, useState } from 'react';
import { listMeetings } from '@/lib/api';
import Link from 'next/link';

interface MeetingSummary {
  id: string;
  title: string;
  summary?: string | null;
  created_at?: string | null;
}

export default function MeetingHistoryPage() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    listMeetings()
      .then((data) => setMeetings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  let filtered = meetings.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && m.created_at) {
      if (new Date(m.created_at) < new Date(dateFrom)) return false;
    }
    if (dateTo && m.created_at) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      if (new Date(m.created_at) > to) return false;
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortOrder === 'newest' ? db - da : da - db;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: '10px' }}>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight" style={{ paddingLeft: '10px', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Meeting History</h1>
        <p className="text-neutral-400 font-medium text-[13px]" style={{ paddingLeft: '10px', marginTop: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
          Browse and search your past meetings
        </p>
      </div>

      {/* Filters Bar */}
      <div className="animate-fade-in-delay-1 bg-white rounded-2xl border border-neutral-300 shadow-sm flex flex-wrap items-end" style={{ padding: '20px', gap: '10px', marginBottom: '10px' }}>
        {/* Search */}
        <div className="flex-1 min-w-[200px] flex flex-col" style={{ gap: '10px' }}>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Search</label>
          <input className="input-field rounded-xl border border-neutral-200 outline-none" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by meeting title..."
            style={{ padding: '12px 16px', paddingLeft: '10px', minHeight: '46px' }}
          />
        </div>
        {/* Date From */}
        <div className="flex flex-col" style={{ width: '170px', gap: '10px' }}>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>From</label>
          <input className="input-field text-neutral-500 rounded-xl border border-neutral-200 outline-none" type="date" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '12px 16px', paddingLeft: '10px', minHeight: '46px' }}
          />
        </div>
        {/* Date To */}
        <div className="flex flex-col" style={{ width: '170px', gap: '10px' }}>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>To</label>
          <input className="input-field text-neutral-500 rounded-xl border border-neutral-200 outline-none" type="date" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '12px 16px', paddingLeft: '10px', minHeight: '46px' }}
          />
        </div>
        {/* Sort */}
        <div className="flex flex-col" style={{ width: '170px', gap: '10px' }}>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" style={{ paddingLeft: '10px', minHeight: '26px', display: 'flex', alignItems: 'center' }}>Sort</label>
          <select className="input-field bg-transparent rounded-xl border border-neutral-200 outline-none" value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            style={{ padding: '12px 16px', paddingLeft: '10px', minHeight: '46px' }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        {/* Clear */}
        {(search || dateFrom || dateTo) && (
          <button className="border border-neutral-200 text-neutral-500 font-bold text-[13px] hover:bg-neutral-50 transition-colors shadow-sm bg-white rounded-xl"
            style={{ padding: '12px 20px', paddingLeft: '10px', minHeight: '46px' }}
            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="animate-fade-in-delay-2" style={{ marginBottom: '10px' }}>
        <span className="text-neutral-500 font-medium text-sm" style={{ paddingLeft: '10px', minHeight: '30px', display: 'inline-flex', alignItems: 'center' }}>
          {loading ? 'Loading...' : `${filtered.length} meeting${filtered.length !== 1 ? 's' : ''} found`}
        </span>
      </div>

      {/* Meeting Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '10px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 animate-pulse" style={{ padding: '20px', height: '160px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl text-center border border-neutral-300 shadow-sm animate-fade-in flex flex-col items-center" style={{ padding: '40px', gap: '10px' }}>
          <span className="text-4xl block" style={{ minHeight: '50px' }}>🔍</span>
          <p className="text-neutral-500 font-medium text-[14px]" style={{ paddingLeft: '10px' }}>
            {search || dateFrom || dateTo
              ? 'No meetings match your filters'
              : 'No meetings yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '10px' }}>
          {filtered.map((m, i) => (
            <Link key={m.id} href={`/meetings/${m.id}`} className="block group">
              <div className="bg-white rounded-2xl h-full border border-neutral-300 shadow-sm transition-all duration-200 group-hover:border-neutral-400 group-hover:shadow-md group-hover:-translate-y-1 flex flex-col" style={{ padding: '20px', gap: '10px' }}>
                {/* Date badge */}
                <div className="flex justify-between items-center">
                  {m.created_at ? (
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-100 rounded-full" style={{ padding: '6px 14px', paddingLeft: '10px', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                      {new Date(m.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-neutral-300 group-hover:text-black transition-colors font-bold text-xl">→</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 className="font-bold text-[16px] text-neutral-900 leading-tight" style={{ paddingLeft: '10px', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                    {m.title}
                  </h3>
                  {m.summary && (
                    <p className="text-neutral-500 text-[13px] leading-relaxed line-clamp-2" style={{ paddingLeft: '10px', minHeight: '36px' }}>
                      {m.summary}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
