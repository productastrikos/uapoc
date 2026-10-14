/**
 * Terminal Operations console shell.
 *
 * Wraps the existing terminal dashboard with a tab bar so the building
 * management console sits alongside it. Same thin-wrapper pattern as the
 * airside console, leaving the original module untouched.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2 } from 'lucide-react';
import TerminalOperations from './TerminalOperations';
import BmsScreen from '../../bms/BmsScreen';

type Tab = 'overview' | 'bms';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Terminal Overview', icon: LayoutDashboard },
  { id: 'bms', label: 'Building Management', icon: Building2 },
];

const TerminalConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="flex flex-col h-full min-h-0">
      <nav className="flex items-center gap-1 mb-4 shrink-0 border-b border-primary-500/40">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                active
                  ? 'text-accent-teal font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && (
                <motion.div
                  layoutId="terminal-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent-teal"
                />
              )}
            </button>
          );
        })}
      </nav>

      {tab === 'overview' && (
        <div className="-mx-6 -mt-4">
          <TerminalOperations />
        </div>
      )}

      {tab === 'bms' && (
        <div className="h-[calc(100vh-11rem)] min-h-0">
          <BmsScreen />
        </div>
      )}
    </div>
  );
};

export default TerminalConsole;
