/**
 * Terminal Operations console shell.
 *
 * Wraps the existing terminal dashboard with sub-navigation so the building
 * management console sits alongside it. Same thin-wrapper pattern as the
 * airside console, with the tab bar rendered into the header.
 *
 * Building Management is the ported HBMS console (src/hbms) — the 12
 * building subsystems, their alerts, SOPs, work orders, asset register and
 * the LBMS zone map. It replaced the earlier BmsScreen, which is kept in
 * src/bms but is no longer routed.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Building2 } from 'lucide-react';
import TerminalOperations from './TerminalOperations';
import HbmsConsole from '../../hbms/HbmsConsole';
import ConsoleTabs, { ConsoleTab } from '../Layout/ConsoleTabs';
import { useNavStore } from '../../store/useNavStore';

type Tab = 'overview' | 'bms';

const TABS: ConsoleTab<Tab>[] = [
  { id: 'overview', label: 'Terminal Overview', icon: LayoutDashboard },
  { id: 'bms', label: 'Building Management', icon: Building2 },
];

const TerminalConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  // Same one-shot hand-off from the AI copilot as the airside console.
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
      <ConsoleTabs tabs={TABS} active={tab} onChange={setTab} layoutId="terminal-tab" />

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
              <TerminalOperations />
            </div>
          )}

          {tab === 'bms' && (
            <div className="h-[calc(100vh-9rem)] min-h-0">
              <HbmsConsole />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TerminalConsole;
