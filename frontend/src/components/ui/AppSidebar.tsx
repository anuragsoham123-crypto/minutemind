"use client";

import { PlusSignIcon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "motion/react";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

interface AppSidebarProps {
  items: SidebarItem[];
  onNewMeeting?: () => void;
  children?: ReactNode;
}

export function AppSidebar({ items, onNewMeeting, children }: AppSidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const selectedIndex = items.findIndex((item) =>
    pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  return (
    <div className="flex min-h-screen relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Sidebar */}
      <motion.div
        animate={{ width: isOpen ? 280 : 64 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className="shrink-0 flex flex-col items-start transition-colors duration-500 ease-out border-r"
        style={{
          padding: '16px 12px',
          background: isOpen ? 'var(--bg-card)' : 'transparent',
          borderColor: 'var(--border)',
        }}
      >
        {/* Top: Logo + toggle */}
        <div
          className="flex items-center w-full shrink-0"
          style={{
            justifyContent: isOpen ? 'space-between' : 'center',
            padding: '8px 4px',
            marginBottom: '10px',
          }}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
                style={{ gap: '10px' }}
              >
                <img 
                  src="/logo.png" 
                  alt="MinuteMind Logo" 
                  className="w-[36px] h-[36px] object-contain shadow-sm rounded-[10px]" 
                />
                <span className="font-extrabold text-[1.1rem] tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MinuteMind
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="shrink-0 flex items-center justify-center cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <HugeiconsIcon
              icon={SidebarLeftIcon}
              className="size-5"
              onClick={() => setIsOpen(!isOpen)}
            />
          </motion.div>
        </div>

        {/* New Meeting button */}
        <AnimatePresence>
          {isOpen && onNewMeeting && (
            <motion.button
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              onClick={onNewMeeting}
              className="w-full flex items-center rounded-xl font-bold text-[12px] uppercase tracking-wider transition-colors active:scale-95"
              style={{
                padding: '14px 16px',
                gap: '10px',
                marginBottom: '10px',
                background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
                color: '#fff',
                boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(217, 119, 6, 0.2)' : 'none'
              }}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              New Meeting
            </motion.button>
          )}
        </AnimatePresence>

        {/* Collapsed + button */}
        {!isOpen && onNewMeeting && (
          <button
            onClick={onNewMeeting}
            className="w-full flex items-center justify-center rounded-xl transition-colors active:scale-95"
            style={{
              padding: '12px 0',
              marginBottom: '10px',
              background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))',
              color: '#fff',
            }}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          </button>
        )}

        {/* Navigation items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col w-full relative z-10 whitespace-nowrap"
              style={{ gap: '4px', marginTop: '6px' }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {items.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="relative cursor-pointer block no-underline"
                    onMouseEnter={() => setHoveredIndex(index)}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 z-0 rounded-lg"
                          style={{ background: theme === 'dark' ? 'var(--bg-card-hover)' : '#e5e5e5' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </AnimatePresence>
                    <div
                      className="relative z-10 flex items-center tracking-tight"
                      style={{
                        padding: '12px 16px',
                        paddingLeft: '10px',
                        gap: '10px',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{item.icon}</span>
                      <span style={{ fontSize: '14px' }}>{item.label}</span>
                    </div>
                    <AnimatePresence>
                      {hoveredIndex === index && !isSelected && (
                        <motion.span
                          layoutId="sidebar-hover-bg"
                          className="absolute inset-0 z-0 rounded-lg"
                          style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout button at bottom */}
        <div className="w-full">
          <button
            onClick={signOut}
            className="w-full flex items-center rounded-xl transition-colors cursor-pointer hover:opacity-80"
            style={{
              padding: isOpen ? '12px 16px' : '12px 0',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: '10px',
              color: '#ef4444',
              background: theme === 'dark' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
            }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            {isOpen && (
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Sign Out
              </span>
            )}
          </button>
        </div>

        {/* Dark mode toggle at bottom */}
        <div className="w-full" style={{ marginTop: '10px' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center rounded-xl transition-colors cursor-pointer"
            style={{
              padding: isOpen ? '12px 16px' : '12px 0',
              justifyContent: isOpen ? 'flex-start' : 'center',
              gap: '10px',
              color: 'var(--text-secondary)',
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: '18px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {isOpen && (
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 w-full min-h-screen overflow-y-auto"
        style={{ padding: '20px 24px' }}
      >
        {children}
      </div>
    </div>
  );
}
