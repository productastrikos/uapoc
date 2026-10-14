/**
 * Apron Management System — domain types.
 *
 * Modelled on the ADB SAFEGATE apron stack, which is the same vendor as the
 * airfield lighting, so the two consoles integrate against one supplier:
 *
 *   Safedock T1 / X  — visual docking guidance system (VDGS), the display the
 *                      pilot flies to on final approach into the stand
 *   SafeControl ADS  — apron drive system head-end that supervises the stands
 *
 * Around each stand sit the services a turnaround depends on: passenger
 * boarding bridge, ground power, pre-conditioned air, fuel pit, apron
 * floodlighting, and the safety devices (emergency stop, fire manual call
 * point) that must be proven serviceable before the stand is declared usable.
 */

/** Where a docking aircraft has got to in the Safedock sequence. */
export type DockingState =
  | 'idle'
  | 'capturing'
  | 'aligning'
  | 'closing'
  | 'stopped'
  | 'docked';

/** Health of a piece of stand equipment. */
export type EquipStatus = 'active' | 'standby' | 'fault' | 'offline';

export type EquipKind =
  | 'vdgs'
  | 'pbb'
  | 'gpu'
  | 'pca'
  | 'fuel'
  | 'flood'
  | 'estop'
  | 'fire';

export interface Equipment {
  /** Tag name, e.g. `BAY03_GPU_01`. */
  id: string;
  kind: EquipKind;
  label: string;
  status: EquipStatus;
  /** Reading shown on the stand faceplate, where the device has one. */
  value?: string;
}

/** Aircraft types the docking simulator can be pointed at. */
export type AircraftType = 'A320' | 'A321' | 'B737-800' | 'B738 MAX' | 'ATR 72' | 'A330';

export interface Vdgs {
  id: string;
  /** Safedock model fitted to this stand. */
  model: string;
  status: EquipStatus;
  /** Metres remaining to the stop bar; what the big digits show. */
  closingDistance: number;
  /**
   * Lateral deviation from the stand centreline in metres. Negative is left of
   * centre from the pilot's seat, which is what the azimuth chevrons indicate.
   */
  azimuth: number;
  /** Text line on the display: aircraft type, SLOW, STOP, OK, or a fault. */
  message: string;
  /** Aircraft type the stand is currently configured to receive. */
  expectedType: AircraftType | null;
}

export interface Stand {
  id: string;
  /** Bay number as painted on the apron. */
  name: string;
  terminal: 'T1' | 'T2';
  /** Contact stands have an airbridge; remote stands are bussed. */
  contact: boolean;
  occupied: boolean;
  aircraftType: AircraftType | null;
  /** Flight currently on or inbound to the stand. */
  flight: string | null;
  docking: DockingState;
  /** How far the aircraft has moved onto the stand, 0–1, for the animation. */
  approach: number;
  chocksOn: boolean;
  chocksOnAt: number | null;
  chocksOffAt: number | null;
  maintenance: boolean;
  vdgs: Vdgs;
  equipment: Equipment[];
}

/** Fault scenarios exposed on the apron simulator. */
export type ApronFaultKind =
  | 'vdgs_fault'
  | 'pbb_disconnect'
  | 'gpu_overload'
  | 'floodlight_low'
  | 'estop_pressed';
