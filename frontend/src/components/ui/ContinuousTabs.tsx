"use client";

import { useState, useEffect, type FC } from "react";
import { motion, LayoutGroup } from "motion/react";

/* ---------- Types ---------- */
export interface TabItem {
    id: string;
    label: string;
}

interface ContinuousTabsProps {
    tabs?: TabItem[];
    defaultActiveId?: string;
    onChange?: (id: string) => void;
    /** Extra classes on the outer <nav> container */
    className?: string;
    /** Extra classes on each tab <button> */
    tabClassName?: string;
    /** Unique layout group id to avoid conflicts when multiple instances exist */
    layoutGroupId?: string;
}

export const ContinuousTabs: FC<ContinuousTabsProps> = ({
    tabs = [],
    defaultActiveId,
    onChange,
    className = "",
    tabClassName = "",
    layoutGroupId,
}) => {
    const [active, setActive] = useState<string>(defaultActiveId || tabs[0]?.id);
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        if (!active && tabs.length > 0) setActive(tabs[0].id);
        requestAnimationFrame(() => setIsMounted(true));
    }, [tabs, active]);

    const handleChange = (id: string) => {
        setActive(id);
        onChange?.(id);
    };

    if (!isMounted) return null;

    const pillId = layoutGroupId ? `active-pill-${layoutGroupId}` : "active-pill";

    return (
        <LayoutGroup id={layoutGroupId}>
            <nav
                className={`
          relative flex items-center mx-auto w-[calc(100%-10px)] max-w-fit gap-22 pl-[32px] pr-[18px] py-2 sm:pl-[36px] sm:pr-[20px] sm:py-2.5
            rounded-full
            border border-[#E5E5E9] dark:border-zinc-800
            bg-linear-to-b from-[#ffffff] to-[#e9e9f2]
            dark:from-[#2d2d2a] dark:to-[#262624]
            shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08),
                    inset_0_1px_0_rgba(255,255,255,0.9),
                    0_4px_12px_rgba(0,0,0,0.03)]
            dark:shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),
                    inset_0_1px_0_rgba(255,255,255,0.02),
                    0_10px_30px_rgba(0,0,0,0.5)]
            transition-all duration-300
            ${className}
          `}
            >
                {tabs.map((tab) => {
                    const isActive = active === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleChange(tab.id)}
                            className={`relative h-15 shrink-0 px-7 py-3 sm:px-8 sm:py-4 rounded-full outline-none ${tabClassName}`}
                        >
                            {/* Active pill */}
                            {isActive && (
                                <motion.div
                                    layoutId={pillId}
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 30,
                                        mass: 0.9,
                                    }}
                                    className="
                      absolute -inset-x-2 inset-y-[2px] rounded-full
                      shadow-xs
                    "
                                    style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}
                                />
                            )}

                            {/* Text */}
                            <motion.span
                                layout="position"
                                className={`relative z-10 text-sm sm:text-base font-semibold transition-colors duration-200
                    ${isActive
                                        ? "text-white dark:text-white"
                                        : "text-[#343437] dark:text-[#a0a098] hover:text-[#62625D] dark:hover:text-[#f5f1eb]"
                                    }
                  `}
                            >
                                {tab.label}
                            </motion.span>
                        </button>
                    );
                })}
            </nav>
        </LayoutGroup>
    );
};