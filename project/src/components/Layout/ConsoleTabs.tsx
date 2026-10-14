/**
 * Console sub-navigation, rendered into the header.
 *
 * A module's tab bar used to sit at the top of the content area, costing a full
 * row of vertical space on every screen. On a console that row matters more
 * than the chrome does, so the bar is portalled into a slot straddling the
 * header's lower edge instead — visually part of the header, still owned by the
 * module that renders it, and the content area gets the space back.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export interface ConsoleTab<T extends string> {
  id: T;
  label: string;
  icon: React.ElementType;
}

interface Props<T extends string> {
  tabs: ConsoleTab<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Distinguishes the sliding indicator between modules. */
  layoutId: string;
}

function ConsoleTabs<T extends string>({ tabs, active, onChange, layoutId }: Props<T>) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  // The slot lives in the header, which mounts before this does — but resolve
  // it in an effect rather than at render so a missing slot degrades to
  // rendering nothing instead of throwing.
  useEffect(() => {
    setHost(document.getElementById('console-tabs'));
  }, []);

  if (!host) return null;

  return createPortal(
    <nav className="fs-chrome flex items-center gap-1 rounded-full bg-primary-700/95 backdrop-blur border border-primary-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.45)] px-1.5 py-1">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              isActive ? 'text-primary-900 font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-accent-teal"
                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </nav>,
    host
  );
}

export default ConsoleTabs;
