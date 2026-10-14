import { ALL_AHU_ASSETS, AHU_FLOOR_LABELS } from './lbmsAssets';

export interface Asset {
  id: string;
  name: string;
  subsystemAcronym: string;
  subsystemId: number;
  subsystemColor: string;
  status: 'Active' | 'Warning' | 'Inactive';
  location: string;
  type: string;
  lastChecked: string;
  serialNumber: string;
  /** Switch position — only set for breaker-type devices (ACB/MCCB/VCB) that the
   *  Supervisor view's Open/Close pie chart tracks. Undefined for everything else. */
  breakerState?: 'Open' | 'Closed';
  /** Which named sub-parameter(s) (e.g. "Conn", "PSU Alm") this unit is failing —
   *  lets a Supervisor-view bar-chart click (e.g. UPS "Alarm") surface exactly which
   *  units have THAT specific issue, not just the whole device type undifferentiated. */
  paramIssues?: string[];
}

// ── SCADA fleet generator — full electrical equipment counts per
//    Documents/Operational screen.xlsx (Device / Qty / Parameters / Chart Type).
//    Hand-writing 1,730 rows isn't practical, so each device type is expanded
//    from a compact spec — this keeps the Asset Register's per-type totals
//    (e.g. 716 MCCB, 100 ACB, 33 VCB) exactly matching the spreadsheet.
interface ScadaTypeSpec {
  code: string;
  type: string;
  qty: number;
  warning: number;          // units with an active trip/alarm
  inactive: number;         // units disconnected / offline
  locations: string[];      // cycled across instances
  warningNames?: string[];  // real-world names for the Warning instances (ties to known SCADA alerts)
  breakerOpen?: number;     // breaker types only — how many of qty currently sit Open (rest are Closed)
  paramIssues?: { label: string; count: number }[]; // single-bar-chart sub-parameters (e.g. "Conn", "PSU Alm") —
                                                      // count of leading Warning/Inactive instances tagged with each,
                                                      // matching the Supervisor view's bar ok/total numbers exactly
}

const SCADA_SPECS: ScadaTypeSpec[] = [
  { code: 'ACB',  type: 'Air Circuit Breaker',          qty: 100, warning: 1, inactive: 0, breakerOpen: 8,
    locations: ['Terminal 1 – LV Switchroom', 'Terminal 2 – LV Switchroom'],
    warningNames: ['ACB Incomer T2-LV-01'] },
  { code: 'MCCB', type: 'Moulded Case Circuit Breaker', qty: 716, warning: 3, inactive: 0, breakerOpen: 54,
    locations: ['Pier A – LV Panel Room', 'Pier B – LV Panel Room', 'Terminal 1 – LV Panel Room', 'Terminal 2 – LV Panel Room'],
    warningNames: ['MCCB Panel LVP-P-B07', 'MCCB Panel LVP-P-A11', 'MCCB Panel LVP-T2-09'] },
  { code: 'ACU',  type: 'Advanced Control Unit',        qty: 117, warning: 0, inactive: 5,
    locations: ['Terminal 1 – Control Room', 'Terminal 2 – Control Room'],
    paramIssues: [{ label: 'Conn', count: 5 }, { label: 'ACU Alm', count: 4 }, { label: 'PSU Alm', count: 2 }] },
  { code: 'AHF',  type: 'Active Harmonic Filter',       qty: 4,   warning: 0, inactive: 0,
    locations: ['Substation 1', 'Substation 2'] },
  { code: 'PFC',  type: 'Power Factor Correction',      qty: 12,  warning: 0, inactive: 0,
    locations: ['Terminal 1 – Substation', 'Terminal 2 – Substation'] },
  { code: 'BC',   type: 'Battery Charger',              qty: 6,   warning: 0, inactive: 0,
    locations: ['Control Room', 'Substation 2'] },
  { code: 'DM',   type: 'Digital Meter',                qty: 622, warning: 0, inactive: 12,
    locations: ['Terminal 1 – Distribution', 'Terminal 2 – Distribution', 'Terminal 3 – Distribution'] },
  { code: 'PM',   type: 'Power Meter',                  qty: 33,  warning: 0, inactive: 0,
    locations: ['Substation 1', 'Substation 2'] },
  { code: 'LS',   type: 'Lighting Server',              qty: 1,   warning: 0, inactive: 0,
    locations: ['Control Room'] },
  { code: 'PR',   type: 'Protection Relay',             qty: 46,  warning: 1, inactive: 0,
    locations: ['Terminal 1 – MV Switchroom', 'Terminal 2 – MV Switchroom'],
    warningNames: ['Protection Relay Feeder 27'] },
  { code: 'RDU',  type: 'Energy Meter',                 qty: 18,  warning: 0, inactive: 0,
    locations: ['Terminal 1', 'Terminal 2', 'Terminal 3'] },
  { code: 'UPS',  type: 'UPS',                          qty: 8,   warning: 0, inactive: 0,
    locations: ['Server Room', 'Control Room'] },
  { code: 'SRF',  type: 'Surge Reduction Filter',       qty: 2,   warning: 0, inactive: 0,
    locations: ['Substation 1', 'Substation 2'] },
  { code: 'TR',   type: 'Transformer',                  qty: 12,  warning: 1, inactive: 0,
    locations: ['Terminal 1 – Substation', 'Terminal 2 – Substation'],
    warningNames: ['Transformer TR-T2-01'] },
  { code: 'VCB',  type: 'Vacuum Circuit Breaker',       qty: 33,  warning: 1, inactive: 0, breakerOpen: 3,
    locations: ['Terminal 1 – MV Switchroom', 'Terminal 2 – MV Switchroom'],
    warningNames: ['VCB Feeder FDR-T1-MV03'] },
];

// LBMS — HVAC: the real 209-unit AHU fleet (same ALL_AHU_ASSETS the LBMS
// Operator view's card grid and Map view use), so the Asset Register and
// every dashboard card built from SUBSYSTEM_ASSET_COUNTS agree with the
// actual per-unit data instead of a handful of unrelated placeholder rows.
// Fault → Inactive is the natural 2-state→3-state mapping (a tripped AHU
// isn't running); this fleet has no Warning-equivalent state.
function buildLbmsAhuAssets(): Asset[] {
  return ALL_AHU_ASSETS.map(a => ({
    id: a.id,
    name: `Air Handling Unit ${a.id}`,
    subsystemAcronym: 'LBMS',
    subsystemId: 5,
    subsystemColor: '#0891B2',
    status: a.status === 'Fault' ? 'Inactive' : 'Active',
    location: `${AHU_FLOOR_LABELS[a.floor]} — Plant Room`,
    type: 'Air Handling Unit',
    lastChecked: a.status === 'Fault' ? '08:1' + (a.seq % 10) : '09:55',
    serialNumber: `SN-LBM-${1000 + a.seq}-${a.floor}`,
  }));
}

function buildScadaAssets(): Asset[] {
  const out: Asset[] = [];
  let serial = 4001;
  for (const spec of SCADA_SPECS) {
    const pad = String(spec.qty).length;
    for (let i = 1; i <= spec.qty; i++) {
      const status: Asset['status'] =
        i <= spec.warning ? 'Warning' :
        i <= spec.warning + spec.inactive ? 'Inactive' : 'Active';
      const idx = String(i).padStart(pad, '0');
      const warnName = status === 'Warning' ? spec.warningNames?.[i - 1] : undefined;
      // Tripped (Warning) breakers are open because of the fault; the rest of the
      // spreadsheet's Open count is just normal isolation/maintenance positioning.
      const breakerState: Asset['breakerState'] =
        spec.breakerOpen === undefined ? undefined : i <= spec.breakerOpen ? 'Open' : 'Closed';
      // Single-bar-chart sub-parameters (e.g. ACU's Conn/ACU Alm/PSU Alm) each flag a
      // leading subset of the Warning/Inactive pool — mirrors the Supervisor view's
      // per-bar ok/total deficit exactly, so a bar click reveals the matching units.
      const paramIssues = spec.paramIssues?.filter(p => i <= p.count).map(p => p.label);
      out.push({
        id: `SCADA-${spec.code}-${idx}`,
        name: warnName ?? `${spec.type} ${spec.code}-${idx}`,
        subsystemAcronym: 'SCADA',
        subsystemId: 10,
        subsystemColor: '#6366F1',
        status,
        breakerState,
        paramIssues: paramIssues && paramIssues.length ? paramIssues : undefined,
        location: spec.locations[(i - 1) % spec.locations.length],
        type: spec.type,
        lastChecked: status === 'Active' ? '09:55' : `09:4${i % 5}`,
        serialNumber: `SN-SCA-${serial++}`,
      });
    }
  }
  return out;
}

export const ASSETS: Asset[] = [
  // BHS — Baggage Handling
  { id: 'BHS-001', name: 'Check-in Belt A1',       subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Active',   location: 'T1 – Check-in Zone',  type: 'Conveyor Belt',      lastChecked: '09:45', serialNumber: 'SN-BHS-1001' },
  { id: 'BHS-002', name: 'Check-in Belt A2',       subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Active',   location: 'T1 – Check-in Zone',  type: 'Conveyor Belt',      lastChecked: '09:45', serialNumber: 'SN-BHS-1002' },
  { id: 'BHS-003', name: 'Sorter Unit S1',         subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Warning',  location: 'T1 – Sorting Hall',   type: 'Sorter',             lastChecked: '09:30', serialNumber: 'SN-BHS-1003' },
  { id: 'BHS-004', name: 'Sorter Unit S2',         subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Active',   location: 'T1 – Sorting Hall',   type: 'Sorter',             lastChecked: '09:45', serialNumber: 'SN-BHS-1004' },
  { id: 'BHS-005', name: 'Conveyor C3',            subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Inactive', location: 'T1 – Level B',        type: 'Conveyor Belt',      lastChecked: '08:00', serialNumber: 'SN-BHS-1005' },
  { id: 'BHS-006', name: 'Baggage Claim BC1',      subsystemAcronym: 'BHS',   subsystemId: 9,  subsystemColor: '#14B8A6', status: 'Active',   location: 'T1 – Arrivals',       type: 'Baggage Carousel',   lastChecked: '09:44', serialNumber: 'SN-BHS-1006' },

  // VDGS — Visual Docking Guidance
  { id: 'VDGS-001', name: 'VDGS Unit Gate A1',    subsystemAcronym: 'VDGS',  subsystemId: 7,  subsystemColor: '#7C3AED', status: 'Active',   location: 'Apron – Gate A1',     type: 'Docking Display',    lastChecked: '09:50', serialNumber: 'SN-VDGS-2001' },
  { id: 'VDGS-002', name: 'VDGS Unit Gate A2',    subsystemAcronym: 'VDGS',  subsystemId: 7,  subsystemColor: '#7C3AED', status: 'Active',   location: 'Apron – Gate A2',     type: 'Docking Display',    lastChecked: '09:50', serialNumber: 'SN-VDGS-2002' },
  { id: 'VDGS-003', name: 'VDGS Unit Gate B1',    subsystemAcronym: 'VDGS',  subsystemId: 7,  subsystemColor: '#7C3AED', status: 'Warning',  location: 'Apron – Gate B1',     type: 'Docking Display',    lastChecked: '09:10', serialNumber: 'SN-VDGS-2003' },
  { id: 'VDGS-004', name: 'VDGS Unit Gate B2',    subsystemAcronym: 'VDGS',  subsystemId: 7,  subsystemColor: '#7C3AED', status: 'Active',   location: 'Apron – Gate B2',     type: 'Docking Display',    lastChecked: '09:50', serialNumber: 'SN-VDGS-2004' },
  { id: 'VDGS-005', name: 'VDGS Unit Gate C1',    subsystemAcronym: 'VDGS',  subsystemId: 7,  subsystemColor: '#7C3AED', status: 'Inactive', location: 'Apron – Gate C1',     type: 'Docking Display',    lastChecked: '07:30', serialNumber: 'SN-VDGS-2005' },

  // CMS — Central Monitoring (Electrical)
  { id: 'CMS-001', name: 'Main Dist. Board MDB-01', subsystemAcronym: 'CMS', subsystemId: 11, subsystemColor: '#14B8A6', status: 'Active',   location: 'Substation 1',        type: 'Distribution Board', lastChecked: '09:55', serialNumber: 'SN-CMS-3001' },
  { id: 'CMS-002', name: 'Main Dist. Board MDB-02', subsystemAcronym: 'CMS', subsystemId: 11, subsystemColor: '#14B8A6', status: 'Active',   location: 'Substation 2',        type: 'Distribution Board', lastChecked: '09:55', serialNumber: 'SN-CMS-3002' },
  { id: 'CMS-003', name: 'Power Quality Meter PQM-1', subsystemAcronym: 'CMS', subsystemId: 11, subsystemColor: '#14B8A6', status: 'Warning', location: 'Substation 1',       type: 'Power Meter',        lastChecked: '09:20', serialNumber: 'SN-CMS-3003' },
  { id: 'CMS-004', name: 'UPS Unit UPS-01',        subsystemAcronym: 'CMS', subsystemId: 11, subsystemColor: '#14B8A6', status: 'Active',   location: 'Server Room',         type: 'UPS',                lastChecked: '09:55', serialNumber: 'SN-CMS-3004' },

  // SCADA — Supervisory Control: full electrical fleet, generated from
  // Documents/Operational screen.xlsx (see SCADA_SPECS above) — 1,730 assets
  // across 15 device types, with per-type counts matching the spreadsheet exactly.
  ...buildScadaAssets(),

  // SACS — Security & Access Control
  { id: 'SACS-001', name: 'Card Reader CR-G07',    subsystemAcronym: 'SACS',  subsystemId: 1,  subsystemColor: '#DC2626', status: 'Warning',  location: 'Gate 7',              type: 'Card Reader',        lastChecked: '09:00', serialNumber: 'SN-SAC-5001' },
  { id: 'SACS-002', name: 'Biometric Scanner BS-01', subsystemAcronym: 'SACS', subsystemId: 1, subsystemColor: '#DC2626', status: 'Active',  location: 'Staff Entry',         type: 'Biometric Scanner',  lastChecked: '09:55', serialNumber: 'SN-SAC-5002' },
  { id: 'SACS-003', name: 'Door Controller DC-T1', subsystemAcronym: 'SACS',  subsystemId: 1,  subsystemColor: '#DC2626', status: 'Active',   location: 'Terminal 1',          type: 'Door Controller',    lastChecked: '09:55', serialNumber: 'SN-SAC-5003' },
  { id: 'SACS-004', name: 'CCTV Integration Hub',  subsystemAcronym: 'SACS',  subsystemId: 1,  subsystemColor: '#DC2626', status: 'Inactive', location: 'Security Center',     type: 'Integration Hub',    lastChecked: '07:00', serialNumber: 'SN-SAC-5004' },
  { id: 'SACS-005', name: 'Turnstile TS-SEC-1',    subsystemAcronym: 'SACS',  subsystemId: 1,  subsystemColor: '#DC2626', status: 'Active',   location: 'Staff Corridor',      type: 'Turnstile',          lastChecked: '09:55', serialNumber: 'SN-SAC-5005' },

  // PAS — Public Address System
  { id: 'PAS-001', name: 'Amplifier AMP-T1',       subsystemAcronym: 'PAS',   subsystemId: 2,  subsystemColor: '#2563EB', status: 'Active',   location: 'T1 – AV Room',        type: 'Amplifier',          lastChecked: '09:55', serialNumber: 'SN-PAS-6001' },
  { id: 'PAS-002', name: 'Speaker Array SA-DEP',   subsystemAcronym: 'PAS',   subsystemId: 2,  subsystemColor: '#2563EB', status: 'Active',   location: 'Departures Hall',     type: 'Speaker',            lastChecked: '09:55', serialNumber: 'SN-PAS-6002' },
  { id: 'PAS-003', name: 'Master Controller MC-01', subsystemAcronym: 'PAS',  subsystemId: 2,  subsystemColor: '#2563EB', status: 'Active',   location: 'Control Room',        type: 'PA Controller',      lastChecked: '09:55', serialNumber: 'SN-PAS-6003' },
  { id: 'PAS-004', name: 'Speaker Array SA-ARR',   subsystemAcronym: 'PAS',   subsystemId: 2,  subsystemColor: '#2563EB', status: 'Active',   location: 'Arrivals Hall',       type: 'Speaker',            lastChecked: '09:55', serialNumber: 'SN-PAS-6004' },

  // FAS — Fire Alarm System
  { id: 'FAS-001', name: 'Fire Panel FP-T1',       subsystemAcronym: 'FAS',   subsystemId: 3,  subsystemColor: '#EA580C', status: 'Active',   location: 'Terminal 1',          type: 'Fire Panel',         lastChecked: '09:55', serialNumber: 'SN-FAS-7001' },
  { id: 'FAS-002', name: 'Smoke Detector SD-G1',   subsystemAcronym: 'FAS',   subsystemId: 3,  subsystemColor: '#EA580C', status: 'Active',   location: 'Gate Area 1',         type: 'Smoke Detector',     lastChecked: '09:55', serialNumber: 'SN-FAS-7002' },
  { id: 'FAS-003', name: 'Heat Detector HD-K1',    subsystemAcronym: 'FAS',   subsystemId: 3,  subsystemColor: '#EA580C', status: 'Active',   location: 'Kitchen Area',        type: 'Heat Detector',      lastChecked: '09:55', serialNumber: 'SN-FAS-7003' },
  { id: 'FAS-004', name: 'Sprinkler Control SC-B1', subsystemAcronym: 'FAS',  subsystemId: 3,  subsystemColor: '#EA580C', status: 'Active',   location: 'Building 1',          type: 'Sprinkler Control',  lastChecked: '09:55', serialNumber: 'SN-FAS-7004' },

  // MCS — Master Clock System
  { id: 'MCS-001', name: 'Master Clock MC-01',     subsystemAcronym: 'MCS',   subsystemId: 4,  subsystemColor: '#8B5CF6', status: 'Active',   location: 'Control Room',        type: 'Master Clock',       lastChecked: '09:55', serialNumber: 'SN-MCS-8001' },
  { id: 'MCS-002', name: 'Secondary Clock SC-T1',  subsystemAcronym: 'MCS',   subsystemId: 4,  subsystemColor: '#8B5CF6', status: 'Active',   location: 'Terminal 1',          type: 'Secondary Clock',    lastChecked: '09:55', serialNumber: 'SN-MCS-8002' },
  { id: 'MCS-003', name: 'GPS Receiver GPS-01',    subsystemAcronym: 'MCS',   subsystemId: 4,  subsystemColor: '#8B5CF6', status: 'Active',   location: 'Roof Level',          type: 'GPS Receiver',       lastChecked: '09:55', serialNumber: 'SN-MCS-8003' },
  { id: 'MCS-004', name: 'Clock Display CD-DEP',   subsystemAcronym: 'MCS',   subsystemId: 4,  subsystemColor: '#8B5CF6', status: 'Active',   location: 'Departures Hall',     type: 'Clock Display',      lastChecked: '09:55', serialNumber: 'SN-MCS-8004' },

  // LBMS — HVAC: real 209-unit AHU fleet (see buildLbmsAhuAssets above),
  // plus a few non-AHU equipment rows for variety.
  ...buildLbmsAhuAssets(),
  { id: 'LBMS-901', name: 'Chiller CH-01',         subsystemAcronym: 'LBMS',  subsystemId: 5,  subsystemColor: '#0891B2', status: 'Active',   location: 'Mechanical Room',     type: 'Chiller',            lastChecked: '09:50', serialNumber: 'SN-LBM-9901' },
  { id: 'LBMS-902', name: 'FCU Zone A',            subsystemAcronym: 'LBMS',  subsystemId: 5,  subsystemColor: '#0891B2', status: 'Warning',  location: 'T1 Zone A',           type: 'Fan Coil Unit',      lastChecked: '09:15', serialNumber: 'SN-LBM-9902' },
  { id: 'LBMS-903', name: 'Cooling Tower CT-01',   subsystemAcronym: 'LBMS',  subsystemId: 5,  subsystemColor: '#0891B2', status: 'Active',   location: 'Rooftop',             type: 'Cooling Tower',      lastChecked: '09:50', serialNumber: 'SN-LBM-9903' },

  // IASS — Aircraft Stand System
  { id: 'IASS-001', name: 'Stand Sensor SS-12',    subsystemAcronym: 'IASS',  subsystemId: 6,  subsystemColor: '#059669', status: 'Warning',  location: 'Stand 12',            type: 'Stand Sensor',       lastChecked: '09:05', serialNumber: 'SN-IAS-0001' },
  { id: 'IASS-002', name: 'Stand Sensor SS-13',    subsystemAcronym: 'IASS',  subsystemId: 6,  subsystemColor: '#059669', status: 'Active',   location: 'Stand 13',            type: 'Stand Sensor',       lastChecked: '09:55', serialNumber: 'SN-IAS-0002' },
  { id: 'IASS-003', name: 'GPU Controller GPU-A1', subsystemAcronym: 'IASS',  subsystemId: 6,  subsystemColor: '#059669', status: 'Active',   location: 'Apron A',             type: 'GPU Controller',     lastChecked: '09:55', serialNumber: 'SN-IAS-0003' },
  { id: 'IASS-004', name: 'PBB Control PBB-01',    subsystemAcronym: 'IASS',  subsystemId: 6,  subsystemColor: '#059669', status: 'Active',   location: 'Gate A1',             type: 'Jet Bridge Control', lastChecked: '09:55', serialNumber: 'SN-IAS-0004' },

  // SSE — Security Screening
  { id: 'SSE-001', name: 'X-Ray Machine XR-01',    subsystemAcronym: 'SSE',   subsystemId: 8,  subsystemColor: '#DB2777', status: 'Active',   location: 'Security Lane 1',     type: 'X-Ray Scanner',      lastChecked: '09:55', serialNumber: 'SN-SSE-B001' },
  { id: 'SSE-002', name: 'X-Ray Machine XR-02',    subsystemAcronym: 'SSE',   subsystemId: 8,  subsystemColor: '#DB2777', status: 'Active',   location: 'Security Lane 2',     type: 'X-Ray Scanner',      lastChecked: '09:55', serialNumber: 'SN-SSE-B002' },
  { id: 'SSE-003', name: 'Body Scanner BS-05',     subsystemAcronym: 'SSE',   subsystemId: 8,  subsystemColor: '#DB2777', status: 'Warning',  location: 'Security Lane 1',     type: 'Body Scanner',       lastChecked: '09:20', serialNumber: 'SN-SSE-B003' },
  { id: 'SSE-004', name: 'WTMD Gate WTMD-03',      subsystemAcronym: 'SSE',   subsystemId: 8,  subsystemColor: '#DB2777', status: 'Active',   location: 'Security Lane 3',     type: 'Walk-Through Detector', lastChecked: '09:55', serialNumber: 'SN-SSE-B004' },
  { id: 'SSE-005', name: 'CT Scanner CT-01',       subsystemAcronym: 'SSE',   subsystemId: 8,  subsystemColor: '#DB2777', status: 'Inactive', location: 'Security Lane 4',     type: 'CT Scanner',         lastChecked: '06:00', serialNumber: 'SN-SSE-B005' },

  // AGAC — Gate Access Control
  { id: 'AGAC-001', name: 'Gate Controller GC-15', subsystemAcronym: 'AGAC',  subsystemId: 13, subsystemColor: '#3B82F6', status: 'Warning',  location: 'Gate 15',             type: 'Gate Controller',    lastChecked: '09:00', serialNumber: 'SN-AGA-C001' },
  { id: 'AGAC-002', name: 'E-Gate EG-01',          subsystemAcronym: 'AGAC',  subsystemId: 13, subsystemColor: '#3B82F6', status: 'Active',   location: 'Immigration',         type: 'E-Gate',             lastChecked: '09:55', serialNumber: 'SN-AGA-C002' },
  { id: 'AGAC-003', name: 'E-Gate EG-02',          subsystemAcronym: 'AGAC',  subsystemId: 13, subsystemColor: '#3B82F6', status: 'Active',   location: 'Immigration',         type: 'E-Gate',             lastChecked: '09:55', serialNumber: 'SN-AGA-C003' },
  { id: 'AGAC-004', name: 'Turnstile TS-T1',       subsystemAcronym: 'AGAC',  subsystemId: 13, subsystemColor: '#3B82F6', status: 'Active',   location: 'Terminal 1',          type: 'Turnstile',          lastChecked: '09:55', serialNumber: 'SN-AGA-C004' },
];

export interface SubsystemAssetCount {
  active: number;
  warning: number;
  inactive: number;
  total: number;
}

export const SUBSYSTEM_ASSET_COUNTS: Record<string, SubsystemAssetCount> = ASSETS.reduce(
  (acc, asset) => {
    if (!acc[asset.subsystemAcronym]) {
      acc[asset.subsystemAcronym] = { active: 0, warning: 0, inactive: 0, total: 0 };
    }
    const key = asset.status.toLowerCase() as 'active' | 'warning' | 'inactive';
    acc[asset.subsystemAcronym][key]++;
    acc[asset.subsystemAcronym].total++;
    return acc;
  },
  {} as Record<string, SubsystemAssetCount>,
);
