/**
 * Terminal map data, lifted verbatim from the HBMS PASTerminalMap.
 *
 * The original rendered these through react-leaflet over a rasterized floor
 * plan. The port keeps the data — device inventory, per-subsystem device type
 * filters, and the PAS speaker zones — and renders it as an SVG schematic
 * instead, so the map costs no map library and matches the other TAMS
 * consoles, which are all SVG plant views.
 *
 * Positions are the original [Y, X] pairs in image space; the renderer
 * normalises them into its own viewBox.
 */

export interface MapDevice {
  id: string;
  name: string;
  type: string;
  pos: [number, number];
  status: 'active' | 'warning' | 'offline';
}

export interface DeviceTypeOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export interface PASZone {
  id: string;
  name: string;
  area: string;
  positions: [number, number][];
  speakerCount: number;
  status: 'active' | 'warning' | 'offline';
}

// ── Per-subsystem device datasets ────────────────────────────────────────────
export const SUBSYSTEM_DEVICES: Record<string, MapDevice[]> = {
  pas: [
    { id: 'SPK-A1', name: 'Terminal Speaker A1', type: 'speakers',    pos: [620, 880],  status: 'active'  },
    { id: 'SPK-A2', name: 'Gate B Runway Spkr',  type: 'speakers',    pos: [550, 360],  status: 'warning' },
    { id: 'SPK-B1', name: 'Terminal Speaker B1', type: 'speakers',    pos: [790, 920],  status: 'active'  },
    { id: 'SPK-C1', name: 'Runway Speaker C1',   type: 'speakers',    pos: [760, 1650], status: 'active'  },
    { id: 'AMP-1',  name: 'Main Amplifier',      type: 'amplifiers',  pos: [700, 1200], status: 'active'  },
    { id: 'AMP-2',  name: 'Backup Amplifier',    type: 'amplifiers',  pos: [640, 680],  status: 'active'  },
    { id: 'CTRL-1', name: 'Zone Controller A',   type: 'controllers', pos: [820, 1400], status: 'active'  },
    { id: 'CTRL-2', name: 'Emergency Control',   type: 'controllers', pos: [680, 1100], status: 'active'  },
  ],
  bhs: [
    { id: 'CONV-1', name: 'Main Belt T1-A',    type: 'conveyors', pos: [620, 880],  status: 'active'  },
    { id: 'CONV-2', name: 'Reclaim Belt T1-B', type: 'conveyors', pos: [790, 920],  status: 'active'  },
    { id: 'CONV-3', name: 'Transfer Belt B2',  type: 'conveyors', pos: [650, 400],  status: 'warning' },
    { id: 'SCAN-1', name: 'HBS Scanner S1',    type: 'scanners',  pos: [760, 1650], status: 'active'  },
    { id: 'SCAN-2', name: 'HBS Scanner S2',    type: 'scanners',  pos: [700, 1200], status: 'active'  },
    { id: 'SORT-1', name: 'Sorter Unit A',     type: 'sorters',   pos: [640, 680],  status: 'active'  },
    { id: 'SORT-2', name: 'Sorter Unit B',     type: 'sorters',   pos: [820, 1400], status: 'active'  },
    { id: 'SORT-3', name: 'Tag Reader TR3',    type: 'sorters',   pos: [680, 1100], status: 'active'  },
  ],
  agac: [
    { id: 'VDG-D1',  name: 'VDGS Display A1',    type: 'displays',     pos: [620, 880],  status: 'active'  },
    { id: 'VDG-D2',  name: 'VDGS Display B2',    type: 'displays',     pos: [790, 920],  status: 'warning' },
    { id: 'VDG-D3',  name: 'Guidance Display C1', type: 'displays',    pos: [760, 1650], status: 'active'  },
    { id: 'RNG-S1',  name: 'Range Sensor A',      type: 'sensors',     pos: [550, 360],  status: 'active'  },
    { id: 'AZI-S1',  name: 'Azimuth Sensor B',    type: 'sensors',     pos: [700, 1200], status: 'active'  },
    { id: 'CTRL-G1', name: 'Dock Control Unit A', type: 'controllers', pos: [640, 680],  status: 'active'  },
    { id: 'CTRL-G2', name: 'Dock Control Unit B', type: 'controllers', pos: [820, 1400], status: 'active'  },
    { id: 'CTRL-G3', name: 'Zone Controller C',   type: 'controllers', pos: [680, 1100], status: 'active'  },
  ],
  sacs: [
    { id: 'RDR-1',  name: 'Card Reader T1',      type: 'readers',  pos: [620, 880],  status: 'active'  },
    { id: 'RDR-2',  name: 'Biometric Reader B1', type: 'readers',  pos: [550, 360],  status: 'warning' },
    { id: 'RDR-3',  name: 'PIN Pad D3',          type: 'readers',  pos: [700, 1200], status: 'active'  },
    { id: 'CAM-S1', name: 'PTZ Camera C1',       type: 'cameras',  pos: [790, 920],  status: 'active'  },
    { id: 'CAM-S2', name: 'Fixed Camera C2',     type: 'cameras',  pos: [760, 1650], status: 'active'  },
    { id: 'BAR-1',  name: 'Turnstile T1',        type: 'barriers', pos: [640, 680],  status: 'active'  },
    { id: 'BAR-2',  name: 'Barrier Gate G2',     type: 'barriers', pos: [820, 1400], status: 'active'  },
    { id: 'BAR-3',  name: 'Access Door D4',      type: 'barriers', pos: [680, 1100], status: 'active'  },
  ],
  fas: [
    { id: 'DET-1', name: 'Smoke Detector Z1', type: 'detectors',  pos: [620, 880],  status: 'active'  },
    { id: 'DET-2', name: 'Heat Detector Z2',  type: 'detectors',  pos: [790, 920],  status: 'active'  },
    { id: 'DET-3', name: 'Beam Detector Z3',  type: 'detectors',  pos: [550, 360],  status: 'warning' },
    { id: 'PNL-1', name: 'Fire Panel FP1',    type: 'panels',     pos: [760, 1650], status: 'active'  },
    { id: 'PNL-2', name: 'Sub-Panel SP2',     type: 'panels',     pos: [700, 1200], status: 'active'  },
    { id: 'SPR-1', name: 'Sprinkler Head H1', type: 'sprinklers', pos: [640, 680],  status: 'active'  },
    { id: 'SPR-2', name: 'Sprinkler Head H2', type: 'sprinklers', pos: [820, 1400], status: 'active'  },
    { id: 'SPR-3', name: 'Sprinkler Head H3', type: 'sprinklers', pos: [680, 1100], status: 'active'  },
  ],
  mcs: [
    { id: 'SEN-M1', name: 'Vibration Sensor V1',   type: 'sensors',   pos: [620, 880],  status: 'active'  },
    { id: 'SEN-M2', name: 'Temperature Sensor T1', type: 'sensors',   pos: [550, 360],  status: 'warning' },
    { id: 'SEN-M3', name: 'Pressure Sensor P2',    type: 'sensors',   pos: [700, 1200], status: 'active'  },
    { id: 'ACT-1',  name: 'Actuator Motor M1',     type: 'actuators', pos: [790, 920],  status: 'active'  },
    { id: 'ACT-2',  name: 'Valve Actuator VA2',    type: 'actuators', pos: [760, 1650], status: 'active'  },
    { id: 'TRM-1',  name: 'CMMS Terminal A',       type: 'terminals', pos: [640, 680],  status: 'active'  },
    { id: 'TRM-2',  name: 'IoT Gateway G1',        type: 'terminals', pos: [820, 1400], status: 'active'  },
    { id: 'TRM-3',  name: 'Monitor Station B',     type: 'terminals', pos: [680, 1100], status: 'active'  },
  ],
  lbms: [
    { id: 'AHU-1',  name: 'Air Handling Unit 1', type: 'AHUs',     pos: [620, 880],  status: 'active'  },
    { id: 'AHU-2',  name: 'Air Handling Unit 2', type: 'AHUs',     pos: [790, 920],  status: 'active'  },
    { id: 'AHU-3',  name: 'Air Handling Unit 3', type: 'AHUs',     pos: [550, 360],  status: 'warning' },
    { id: 'CHL-1',  name: 'Chiller Plant A',     type: 'chillers', pos: [760, 1650], status: 'active'  },
    { id: 'CHL-2',  name: 'Chiller Plant B',     type: 'chillers', pos: [700, 1200], status: 'active'  },
    { id: 'SEN-L1', name: 'CO\u2082 Sensor Z1',  type: 'sensors',  pos: [640, 680],  status: 'active'  },
    { id: 'SEN-L2', name: 'Humidity Sensor Z2',  type: 'sensors',  pos: [820, 1400], status: 'active'  },
    { id: 'SEN-L3', name: 'Temp Sensor Z3',      type: 'sensors',  pos: [680, 1100], status: 'active'  },
  ],
  iass: [
    { id: 'CAM-I1', name: 'CCTV Camera T1',     type: 'cameras',  pos: [620, 880],  status: 'active'  },
    { id: 'CAM-I2', name: 'PTZ Camera B2',       type: 'cameras',  pos: [790, 920],  status: 'active'  },
    { id: 'CAM-I3', name: 'Perimeter Cam P1',    type: 'cameras',  pos: [760, 1650], status: 'active'  },
    { id: 'XRY-1',  name: 'Baggage X-Ray S1',    type: 'scanners', pos: [550, 360],  status: 'warning' },
    { id: 'XRY-2',  name: 'Baggage X-Ray S2',    type: 'scanners', pos: [700, 1200], status: 'active'  },
    { id: 'ALM-1',  name: 'Alarm Panel A1',      type: 'alarms',   pos: [640, 680],  status: 'active'  },
    { id: 'ALM-2',  name: 'Emergency Button B1', type: 'alarms',   pos: [820, 1400], status: 'active'  },
    { id: 'ALM-3',  name: 'Intrusion Sensor I1', type: 'alarms',   pos: [680, 1100], status: 'active'  },
  ],
  vdgs: [
    { id: 'DSP-V1',  name: 'VDGS Display Gate 1', type: 'displays',     pos: [620, 880],  status: 'active'  },
    { id: 'DSP-V2',  name: 'VDGS Display Gate 2', type: 'displays',     pos: [550, 360],  status: 'warning' },
    { id: 'DSP-V3',  name: 'VDGS Display Gate 3', type: 'displays',     pos: [790, 920],  status: 'active'  },
    { id: 'SEN-V1',  name: 'Range Sensor R1',      type: 'sensors',      pos: [760, 1650], status: 'active'  },
    { id: 'SEN-V2',  name: 'Azimuth Sensor A1',    type: 'sensors',      pos: [700, 1200], status: 'active'  },
    { id: 'CTRL-V1', name: 'Dock Controller D1',   type: 'controllers',  pos: [640, 680],  status: 'active'  },
    { id: 'CTRL-V2', name: 'Dock Controller D2',   type: 'controllers',  pos: [820, 1400], status: 'active'  },
    { id: 'CTRL-V3', name: 'VDGS Master Control',  type: 'controllers',  pos: [680, 1100], status: 'active'  },
  ],
  sse: [
    { id: 'GPU-1', name: 'GPU Stand 1',    type: 'GPUs',    pos: [620, 880],  status: 'active'  },
    { id: 'GPU-2', name: 'GPU Stand 2',    type: 'GPUs',    pos: [550, 360],  status: 'warning' },
    { id: 'GPU-3', name: 'GPU Stand 3',    type: 'GPUs',    pos: [790, 920],  status: 'active'  },
    { id: 'JBR-1', name: 'Jet Bridge J1', type: 'bridges', pos: [760, 1650], status: 'active'  },
    { id: 'JBR-2', name: 'Jet Bridge J2', type: 'bridges', pos: [700, 1200], status: 'active'  },
    { id: 'JBR-3', name: 'Jet Bridge J3', type: 'bridges', pos: [640, 680],  status: 'active'  },
    { id: 'PCA-1', name: 'PCA Unit P1',   type: 'PCAs',    pos: [820, 1400], status: 'active'  },
    { id: 'PCA-2', name: 'PCA Unit P2',   type: 'PCAs',    pos: [680, 1100], status: 'active'  },
  ],
  scada: [
    { id: 'PLC-1', name: 'PLC Unit A1',          type: 'PLCs',  pos: [620, 880],  status: 'active'  },
    { id: 'PLC-2', name: 'PLC Unit B2',          type: 'PLCs',  pos: [790, 920],  status: 'active'  },
    { id: 'PLC-3', name: 'PLC Unit C3',          type: 'PLCs',  pos: [700, 1200], status: 'active'  },
    { id: 'RTU-1', name: 'RTU Remote T1',        type: 'RTUs',  pos: [550, 360],  status: 'warning' },
    { id: 'RTU-2', name: 'RTU Remote T2',        type: 'RTUs',  pos: [760, 1650], status: 'active'  },
    { id: 'HMI-1', name: 'SCADA HMI Station A',  type: 'HMIs',  pos: [640, 680],  status: 'active'  },
    { id: 'HMI-2', name: 'SCADA HMI Station B',  type: 'HMIs',  pos: [820, 1400], status: 'active'  },
    { id: 'HMI-3', name: 'Operator Console C',   type: 'HMIs',  pos: [680, 1100], status: 'active'  },
  ],
  cms: [
    { id: 'CLK-1', name: 'Master Clock MC1',    type: 'clocks',   pos: [620, 880],  status: 'active'  },
    { id: 'CLK-2', name: 'Slave Clock SC2',     type: 'clocks',   pos: [790, 920],  status: 'active'  },
    { id: 'CLK-3', name: 'Slave Clock SC3',     type: 'clocks',   pos: [700, 1200], status: 'active'  },
    { id: 'SRV-1', name: 'NTP Server N1',       type: 'servers',  pos: [550, 360],  status: 'active'  },
    { id: 'SRV-2', name: 'NTP Server N2',       type: 'servers',  pos: [760, 1650], status: 'active'  },
    { id: 'SRV-3', name: 'NTP Server N3',       type: 'servers',  pos: [640, 680],  status: 'warning' },
    { id: 'ANT-1', name: 'GPS/GNSS Antenna A',  type: 'antennas', pos: [820, 1400], status: 'active'  },
    { id: 'ANT-2', name: 'GPS/GNSS Antenna B',  type: 'antennas', pos: [680, 1100], status: 'active'  },
  ],
  lcms: [
    { id: 'DAL-1', name: 'DALI Controller Bus 1', type: 'controllers', pos: [620, 880],  status: 'active'  },
    { id: 'DAL-2', name: 'DALI Controller Bus 2', type: 'controllers', pos: [790, 920],  status: 'active'  },
    { id: 'DAL-3', name: 'DALI Controller Bus 3', type: 'controllers', pos: [700, 1200], status: 'active'  },
    { id: 'DAL-4', name: 'DALI Controller Bus 4', type: 'controllers', pos: [550, 360],  status: 'warning' },
    { id: 'LUX-1', name: 'Lux Sensor Zone A',     type: 'sensors',     pos: [760, 1650], status: 'active'  },
    { id: 'LUX-2', name: 'Lux Sensor Zone B',     type: 'sensors',     pos: [640, 680],  status: 'active'  },
    { id: 'PIR-1', name: 'PIR Sensor Zone C',     type: 'sensors',     pos: [820, 1400], status: 'active'  },
    { id: 'FXT-1', name: 'Emergency Light EM1',   type: 'fixtures',    pos: [680, 1100], status: 'active'  },
  ],
};

export const SUBSYSTEM_DEVICE_TYPES: Record<string, DeviceTypeOption[]> = {
  pas:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'speakers',     label: 'Speakers',     icon: '🔊', color: '#01A3A4' }, { value: 'amplifiers',   label: 'Amplifiers',   icon: '⚡', color: '#E6B85C' }, { value: 'controllers',  label: 'Controllers',  icon: '🎛', color: '#34d399' }],
  bhs:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'conveyors',    label: 'Conveyors',    icon: '🔄', color: '#01A3A4' }, { value: 'scanners',     label: 'Scanners',     icon: '📡', color: '#E6B85C' }, { value: 'sorters',      label: 'Sorters',      icon: '🔀', color: '#34d399' }],
  agac:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'displays',     label: 'Displays',     icon: '🖥', color: '#01A3A4' }, { value: 'sensors',      label: 'Sensors',      icon: '📡', color: '#E6B85C' }, { value: 'controllers',  label: 'Controllers',  icon: '🎛', color: '#34d399' }],
  sacs:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'readers',      label: 'Readers',      icon: '🪪', color: '#01A3A4' }, { value: 'cameras',      label: 'Cameras',      icon: '📷', color: '#E6B85C' }, { value: 'barriers',     label: 'Barriers',     icon: '🚧', color: '#34d399' }],
  fas:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'detectors',    label: 'Detectors',    icon: '🔥', color: '#f59e0b' }, { value: 'panels',       label: 'Panels',       icon: '📋', color: '#01A3A4' }, { value: 'sprinklers',   label: 'Sprinklers',   icon: '💧', color: '#34d399' }],
  mcs:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'sensors',      label: 'Sensors',      icon: '📡', color: '#01A3A4' }, { value: 'actuators',    label: 'Actuators',    icon: '⚙',  color: '#E6B85C' }, { value: 'terminals',    label: 'Terminals',    icon: '💻', color: '#34d399' }],
  lbms:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'AHUs',         label: 'AHUs',         icon: '🌡', color: '#01A3A4' }, { value: 'chillers',     label: 'Chillers',     icon: '❄',  color: '#E6B85C' }, { value: 'sensors',      label: 'Sensors',      icon: '📡', color: '#34d399' }],
  iass:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'cameras',      label: 'Cameras',      icon: '📷', color: '#01A3A4' }, { value: 'scanners',     label: 'Scanners',     icon: '🔬', color: '#E6B85C' }, { value: 'alarms',       label: 'Alarms',       icon: '🚨', color: '#ef4444' }],
  vdgs:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'displays',     label: 'Displays',     icon: '🖥', color: '#01A3A4' }, { value: 'sensors',      label: 'Sensors',      icon: '📡', color: '#E6B85C' }, { value: 'controllers',  label: 'Controllers',  icon: '🎛', color: '#34d399' }],
  sse:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'GPUs',         label: 'GPUs',         icon: '⚡', color: '#01A3A4' }, { value: 'bridges',      label: 'Jet Bridges',  icon: '🌉', color: '#E6B85C' }, { value: 'PCAs',         label: 'PCA Units',    icon: '❄',  color: '#34d399' }],
  scada: [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'PLCs',         label: 'PLCs',         icon: '💡', color: '#01A3A4' }, { value: 'RTUs',         label: 'RTUs',         icon: '📡', color: '#E6B85C' }, { value: 'HMIs',         label: 'HMIs',         icon: '🖥', color: '#34d399' }],
  cms:   [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'clocks',       label: 'Clocks',       icon: '🕐', color: '#01A3A4' }, { value: 'servers',      label: 'NTP Servers',  icon: '🖥', color: '#E6B85C' }, { value: 'antennas',     label: 'Antennas',     icon: '📡', color: '#34d399' }],
  lcms:  [{ value: 'all', label: 'All Devices', icon: '◉', color: '#22C7C6' }, { value: 'controllers',  label: 'Controllers',  icon: '🎛', color: '#01A3A4' }, { value: 'sensors',      label: 'Sensors',      icon: '📡', color: '#E6B85C' }, { value: 'fixtures',     label: 'Fixtures',     icon: '💡', color: '#34d399' }],
};

export const PAS_ZONES: PASZone[] = [
  {
    id: 'PAS-1',
    name: 'Zone PAS-1',
    area: '43.21 m²',
    positions: [
      [400, 920],
      [400, 990],
      [470, 990],
      [470, 920],
    ],
    speakerCount: 12,
    status: 'active',
  },
  {
    id: 'PAS-2',
    name: 'Zone PAS-2',
    area: '62.00 m²',
    positions: [
      // [500, 300],
      // [500, 400],
      // [600, 400],
      // [600, 300],
      [600, 350],
      [600, 450],
      [700, 450],
      [700, 350],
    ],
    speakerCount: 18,
    status: 'active',
  },
  {
    id: 'PAS-3',
    name: 'Zone PAS-3',
    area: '85.00 m²',
    positions: [
      [950, 940],
      [950, 1040],
      [850, 1040],
      [850, 940],
    ],
    speakerCount: 24,
    status: 'active',
  },
  {
    id: 'PAS-4',
    name: 'Zone PAS-4',
    area: '55.50 m²',
    positions: [
      [590, 1510],
      [590, 1610],
      [690, 1610],
      [690, 1510],
    ],
    speakerCount: 16,
    status: 'active',
  },
];

