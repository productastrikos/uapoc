/**
 * The 12-subsystem catalog.
 *
 * Ported from the source's `HBMS_SUBSYSTEMS` (which lived in its Sidebar).
 * Only the identity colours are changed — the source picked a saturated hue
 * per subsystem from a generic palette; these are drawn from the TAMS ramps so
 * a row of subsystem chips reads as one system next to the other consoles.
 *
 * `code` is the lowercase key SubsystemPage and the terminal map are addressed
 * by, and `id` is the numeric id the asset register carries on every row.
 */

import React from 'react';
import {
  Package, Navigation, Zap, Gauge, Lock, Volume2,
  AlertTriangle, Clock, Wind, Plane, Scan, Key,
} from 'lucide-react';

import PASDetails from './PASDetails';
import BHSDetails from './BHSDetails';
import VDGSDetails from './VDGSDetails';
import CMSDetails from './CMSDetails';
import SACSDetails from './SACSDetails';
import FASDetails from './FASDetails';
import MCSDetails from './MCSDetails';
import IASSDetails from './IASSDetails';
import SSEDetails from './SSEDetails';
import AGACDetails from './AGACDetails';
import SCADADetails from './SCADADetails';
import LBMSDetails from './LBMSDetails';

export interface HBMSSubsystem {
  id: number;
  name: string;
  acronym: string;
  icon: React.ReactNode;
  color: string;
  availability: number;
  alertCount: number;
  refreshIntervalSec: number;
}

export interface SubsystemEntry extends HBMSSubsystem {
  /** SubsystemPage / terminal-map key. */
  code: string;
  component: React.ComponentType;
}

const ic = (Icon: React.ElementType) => <Icon className="w-3.5 h-3.5" />;

export const HBMS_SUBSYSTEMS: SubsystemEntry[] = [
    { id: 5,  code: 'lbms',  name: 'HVAC',                     acronym: 'LBMS',  icon: ic(Wind),          color: '#E6B85C', availability: 94,   alertCount: 1, refreshIntervalSec: 30,  component: LBMSDetails },
  { id: 9,  code: 'bhs',   name: 'Baggage Handling',         acronym: 'BHS',   icon: ic(Package),       color: '#01A3A4', availability: 97,   alertCount: 2, refreshIntervalSec: 20,  component: BHSDetails },
  { id: 7,  code: 'vdgs',  name: 'Visual Docking Guidance',  acronym: 'VDGS',  icon: ic(Navigation),    color: '#5FDCDA', availability: 97,   alertCount: 2, refreshIntervalSec: 45,  component: VDGSDetails },
  { id: 11, code: 'cms',   name: 'Central Monitoring (Elec.)', acronym: 'CMS', icon: ic(Zap),           color: '#22C7C6', availability: 98,   alertCount: 2, refreshIntervalSec: 60,  component: CMSDetails },
  { id: 10, code: 'scada', name: 'Supervisory Control',      acronym: 'SCADA', icon: ic(Gauge),         color: '#018587', availability: 97,   alertCount: 1, refreshIntervalSec: 15,  component: SCADADetails },
  { id: 1,  code: 'sacs',  name: 'Security & Access Control', acronym: 'SACS', icon: ic(Lock),          color: '#EF4444', availability: 96,   alertCount: 2, refreshIntervalSec: 25,  component: SACSDetails },
  { id: 2,  code: 'pas',   name: 'Public Address System',    acronym: 'PAS',   icon: ic(Volume2),       color: '#016E70', availability: 98,   alertCount: 0, refreshIntervalSec: 90,  component: PASDetails },
  { id: 3,  code: 'fas',   name: 'Fire Alarm System',        acronym: 'FAS',   icon: ic(AlertTriangle), color: '#F59E0B', availability: 99,   alertCount: 0, refreshIntervalSec: 10,  component: FASDetails },
  { id: 4,  code: 'mcs',   name: 'Master Clock System',      acronym: 'MCS',   icon: ic(Clock),         color: '#C09429', availability: 99.5, alertCount: 0, refreshIntervalSec: 120, component: MCSDetails },

  { id: 6,  code: 'iass',  name: 'Aircraft Stand System',    acronym: 'IASS',  icon: ic(Plane),         color: '#10B981', availability: 95,   alertCount: 1, refreshIntervalSec: 40,  component: IASSDetails },
  { id: 8,  code: 'sse',   name: 'Security Screening',       acronym: 'SSE',   icon: ic(Scan),          color: '#9BEAE8', availability: 96,   alertCount: 2, refreshIntervalSec: 20,  component: SSEDetails },
  { id: 13, code: 'agac',  name: 'Gate Access Control',      acronym: 'AGAC',  icon: ic(Key),           color: '#F5DCA8', availability: 96,   alertCount: 1, refreshIntervalSec: 35,  component: AGACDetails },
];

export const subsystemByCode = (code: string): SubsystemEntry | undefined =>
  HBMS_SUBSYSTEMS.find((s) => s.code === code);

export const subsystemById = (id: number): SubsystemEntry | undefined =>
  HBMS_SUBSYSTEMS.find((s) => s.id === id);
