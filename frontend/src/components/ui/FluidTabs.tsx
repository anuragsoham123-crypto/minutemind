'use client';

import { useState, type ReactNode, type FC, useEffect } from 'react';
import { motion, AnimateSharedLayout } from 'motion/react';

export interface FluidTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface FluidTabsProps {
  tabs?: FluidTabItem[];
  defaultActive?: string;
  onChange?: (id: string) => void;
}

export const FluidTabs: FC<FluidTabsProps> = ({
  tabs = [],
  defaultActive,
  onChange,
}) => {
  const [active, setActive] = useState<string>(defaultActive || tabs[0]?.id);

  useEffect(() => {
    if (!active && tabs.length > 0) setActive(tabs[0].id);
  }, [tabs, active]);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className="relative flex items-center gap-3 rounded-[3.6rem] border-[2px] border-[#f5f1ebf4] bg-[#F5F1EB] px-1 py-0 transition-colors sm:gap-1.5 dark:border-neutral-800 dark:bg-neutral-900 w-full sm:w-fit overflow-x-auto" style={{ height: '16px' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className="group relative rounded-[1.5rem] px-5 py-0 outline-none sm:px-8 sm:py-0"
            style={{ height: '16px', display: 'flex', alignItems: 'center' }}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 25,
                  mass: 0.8,
                }}
                className="absolute inset-0 rounded-[1rem] border border-[#fefefe]/90 bg-gradient-to-b from-[#fefefe] to-gray-50/80 shadow-xs dark:border-neutral-600/50 dark:from-neutral-700 dark:to-neutral-800/90"
              />
            )}

            <motion.div
              transition={{
                duration: 0.3,
                ease: 'easeOut',
              }}
              animate={{
                filter: isActive
                  ? ['blur(0px)', 'blur(1px)', 'blur(0px)']
                  : 'blur(0px)',
              }}
              className={`relative z-10 flex items-center gap-1.5 transition-colors duration-200 sm:gap-2.5 ${isActive
                  ? 'font-bold text-[#292926] dark:text-white'
                  : 'font-semibold text-[#585652] dark:text-neutral-500 group-hover:dark:text-neutral-300'
                }`}
            >
              {tab.icon && (
                <motion.div
                  animate={{ scale: isActive ? 1.03 : 1 }}
                  transition={{ scale: { type: 'spring', stiffness: 300, damping: 15 } }}
                  className="flex shrink-0 items-center justify-center"
                >
                  {tab.icon}
                </motion.div>
              )}

              <span className="text-[10px] tracking-tight whitespace-nowrap sm:text-[11px] leading-none">
                {tab.label}
              </span>

              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  {tab.count}
                </span>
              )}
            </motion.div>
          </button>
        );
      })}
    </div>
  );
};
