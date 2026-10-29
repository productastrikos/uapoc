/**
 * Airside Operations console shell.
 *
 * Wraps the existing airside dashboard with sub-navigation so the airfield
 * lighting and apron consoles live alongside it. Kept as a thin wrapper so the
 * original module is untouched; the tab bar itself renders into the header, so
 * it costs the content area no vertical space.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Lightbulb, ParkingSquare } from 'lucide-react';
import AirsideOperations from './AirsideOperations';
import AGLScreen from '../../agl/AGLScreen';
import ApronScreen from '../../apron/ApronScreen';
import ConsoleTabs, { ConsoleTab } from '../Layout/ConsoleTabs';
import { useNavStore } from '../../store/useNavStore';

type Tab = 'overview' | 'agl' | 'apron';

const TABS: ConsoleTab<Tab>[] = [
  { id: 'overview', label: 'Airside Overview', icon: LayoutDashboard },
  { id: 'agl', label: 'Airfield Ground Lighting', icon: Lightbulb },
  { id: 'apron', label: 'Apron Management', icon: ParkingSquare },
];

const AirsideConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  // The AI copilot can send an operator straight to a sub-console. The
  // request is consumed once and cleared, so a manual tab change afterwards
  // is not pulled back by stale nav state.
  const subTab = useNavStore((s) => s.subTab);
  const clearSubTab = useNavStore((s) => s.clearSubTab);
  useEffect(() => {
    if (subTab && TABS.some((t) => t.id === subTab)) {
      setTab(subTab as Tab);
      clearSubTab();
    }
  }, [subTab, clearSubTab]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <ConsoleTabs tabs={TABS} active={tab} onChange={setTab} layoutId="airside-tab" />

      {/* Same cross-fade the module switcher one level up already uses, so the
          sub-tab switch within this console reads as consistently animated. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-1 min-h-0 flex flex-col"
        >
          {tab === 'overview' && (
            <div className="-mx-6 -mt-6">
              <AirsideOperations />
            </div>
          )}

          {/* The AGL and apron consoles manage their own internal scroll regions,
              so each is given the full remaining viewport rather than growing the
              page. */}
          {tab === 'agl' && (
            <div className="h-[calc(100vh-9rem)] min-h-0">
              <AGLScreen />
            </div>
          )}

          {tab === 'apron' && (
            <div className="h-[calc(100vh-9rem)] min-h-0">
              <ApronScreen />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AirsideConsole;
