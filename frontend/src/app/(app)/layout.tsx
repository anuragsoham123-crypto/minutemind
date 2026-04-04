'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppSidebar, type SidebarItem } from '@/components/ui/AppSidebar';
import { CreateModal } from '@/components/ui/CreateModal';
import { createMeeting } from '@/lib/api';

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: ' ' },
  { id: 'meetings', label: 'Meetings', href: '/meetings', icon: ' ' },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: ' ' },
  { id: 'teams', label: 'Teams', href: '/teams', icon: ' ' },
  { id: 'my-tasks', label: 'My Tasks', href: '/my-tasks', icon: ' ' },
  { id: 'insights', label: 'Insights', href: '/insights', icon: ' ' },
  { id: 'workload', label: 'Workload', href: '/workload', icon: ' ' },
  { id: 'briefs', label: 'Pre-Meeting Brief', href: '/briefs', icon: ' ' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="glass-card animate-pulse-glow px-12 py-8 text-center" style={{ background: 'var(--bg-card)' }}>
          <img src="/logo.png" alt="Loading Logo" className="w-[48px] h-[48px] object-contain mx-auto mb-4 drop-shadow-sm" />
          <p style={{ color: 'var(--text-muted)' }} className="font-semibold tracking-wide">Loading MinuteMind...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleCreateMeeting = async (data: any) => {
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', data.title);
      if (data.transcript) fd.append('transcript', data.transcript);
      if (data.audio) fd.append('audio', data.audio);
      const res = await createMeeting(fd);
      setShowNewMeeting(false);
      router.push(`/meetings/${res.id}`);
    } catch {
      alert("Failed to create meeting.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <AppSidebar items={sidebarItems} onNewMeeting={() => setShowNewMeeting(true)}>
        {children}
      </AppSidebar>

      <CreateModal
        isOpen={showNewMeeting}
        onClose={() => setShowNewMeeting(false)}
        onCreate={handleCreateMeeting}
        mode="meeting"
        title="Create Meeting"
        description="Start a new meeting to track action items and decisions."
        loading={creating}
      />
    </>
  );
}
