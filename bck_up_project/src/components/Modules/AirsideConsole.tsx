/**
 * Airside Operations console shell.
 *
 * Wraps the existing airside dashboard with a tab bar so the airfield ground
 * lighting console lives alongside it rather than replacing it. Kept as a thin
 * wrapper so the original module is untouched.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Lightbulb, ParkingSquare } from 'lucide-react';
import AirsideOperations from './AirsideOperations';
import AGLScreen from '../../agl/AGLScreen';
import ApronScreen from '../../apron/ApronScreen';

type Tab = 'overview' | 'agl' | 'apron';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Airside Overview', icon: LayoutDashboard },
  { id: 'agl', label: 'Airfield Ground Lighting', icon: Lightbulb },
  { id: 'apron', label: 'Apron Management', icon: ParkingSquare },
];

const AirsideConsole: React.FC = () => {
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
                  layoutId="airside-tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent-teal"
                />
              )}
            </button>
          );
        })}
      </nav>

      {tab === 'overview' && (
        <div className="-mx-6 -mt-4">
          <AirsideOperations />
        </div>
      )}

      {/* The AGL and apron consoles manage their own internal scroll regions,
          so each is given the full remaining viewport rather than growing the
          page. */}
      {tab === 'agl' && (
        <div className="h-[calc(100vh-11rem)] min-h-0">
          <AGLScreen />
        </div>
      )}

      {tab === 'apron' && (
        <div className="h-[calc(100vh-11rem)] min-h-0">
          <ApronScreen />
        </div>
      )}
    </div>
  );
};

export default AirsideConsole;
