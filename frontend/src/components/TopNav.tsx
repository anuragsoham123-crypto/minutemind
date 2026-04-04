'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ContinuousTabs } from '@/components/ui/ContinuousTabs';

const navItems = [
  { id: '/dashboard', label: 'Dashboard' },
  { id: '/meetings', label: 'Meetings' },
  { id: '/tasks', label: 'Tasks' },
];

export default function TopNav({ onNewMeeting }: { onNewMeeting?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const activeId = navItems.find((item) =>
    item.id === '/meetings'
      ? pathname === '/meetings' || pathname?.startsWith('/meetings/')
      : pathname === item.id
  )?.id || '/dashboard';

  return (
    <nav className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-full mx-auto px-[10px] lg:px-[20px]">
        <div className="flex justify-between items-center" style={{ minHeight: '62px' }}>

          {/* Logo & Tabs */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            <Link href="/" className="flex items-center group decoration-transparent" style={{ gap: '10px' }}>
              <img 
                src="/logo.png" 
                alt="MinuteMind Logo" 
                className="w-[36px] h-[36px] object-contain transition-transform group-hover:scale-105" 
              />
              <span className="font-extrabold text-black text-[1.2rem] tracking-tight leading-tight" style={{ paddingLeft: '10px' }}>MinuteMind</span>
            </Link>

            <div className="hidden sm:block" style={{ marginLeft: '10px' }}>
              <ContinuousTabs
                tabs={navItems}
                defaultActiveId={activeId}
                onChange={(id) => { window.location.href = id; }}
                layoutGroupId="navbar"
                className="gap-[10px] p-2 sm:p-3"
                tabClassName="!px-10 !py-2 sm:!px-12 sm:!py-2"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center" style={{ gap: '10px' }}>
            {onNewMeeting && (
              <button
                onClick={onNewMeeting}
                className="hidden sm:flex items-center bg-black text-white rounded-[5rem] tracking-wider text-[11px] uppercase font-bold hover:bg-neutral-800 transition-colors active:scale-95 whitespace-nowrap shadow-lg"
                style={{ padding: '15px 28px', gap: '8px', minHeight: '50px' }}
              >
                <span className="text-[16px]">➕</span>
                <span className="text-[11px]">New Meeting</span>
                <span className="text-[8px] text-black">.</span>
              </button>
            )}

            {user && (
              <div className="relative group cursor-pointer">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="rounded-full border border-neutral-200" style={{ width: '36px', height: '36px' }} />
                ) : (
                  <div className="rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600" style={{ width: '36px', height: '36px' }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform translate-y-[-10px] group-hover:translate-y-0">
                  <div className="border-b border-neutral-100 flex flex-col" style={{ padding: '10px', gap: '2px' }}>
                    <span className="text-sm font-bold text-neutral-900 truncate" style={{ paddingLeft: '10px' }}>{user.displayName || 'User'}</span>
                    <span className="text-[11px] text-neutral-500 truncate" style={{ paddingLeft: '10px' }}>{user.email}</span>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button onClick={signOut} className="w-full text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors" style={{ padding: '8px 10px', paddingLeft: '10px' }}>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
