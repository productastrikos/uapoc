/**
 * Live feeds from the Pantherlake edge node, over MQTT.
 *
 * Pantherlake publishes per-camera analytics to a public MQTT broker
 * (broker.hivemq.com — proven working end-to-end, but a public, open test
 * broker, not for production) on
 *   astrikedge/{NODE_ID}/{usecase}/cameras/{camera_id}/analytics
 * for two usecases:
 *   queue   — { camera_id, queue_length, fps, ... }
 *   baggage — { camera_id, bags: [{ bag_id, label, unattended_seconds, alert }], alert, fps, ... }
 *
 * Both usecases number their cameras camera_01..04, so messages are routed by
 * topic, never by payload shape alone.
 *
 * Connects once (the first caller wins; later calls are no-ops) and keeps the
 * latest state in a small zustand store. The broker address, topic prefix, node
 * id and credentials are set in `.env` (see `.env.example`) — point it at a
 * private, authenticated broker before this goes anywhere near a real deployment.
 */

import mqtt, { type MqttClient } from 'mqtt';
import { create } from 'zustand';

// Broker settings come from `.env` (see `.env.example`), and fall back to the
// public test broker so a missing file doesn't break the feed. `||` rather than
// `??` on purpose: an empty `VITE_MQTT_URL=` should also mean "use the default".
const env = import.meta.env;
const BROKER_URL = env.VITE_MQTT_URL || 'wss://broker.hivemq.com:8884/mqtt';
const NODE_ID = env.VITE_MQTT_NODE_ID || 'pantherlake01';
const TOPIC_PREFIX = env.VITE_MQTT_TOPIC_PREFIX || 'astrikedge';
const MQTT_USERNAME = env.VITE_MQTT_USERNAME || undefined;
const MQTT_PASSWORD = env.VITE_MQTT_PASSWORD || undefined;
const QUEUE_TOPIC = `${TOPIC_PREFIX}/${NODE_ID}/queue/cameras/+/analytics`;
const BAGGAGE_TOPIC = `${TOPIC_PREFIX}/${NODE_ID}/baggage/cameras/+/analytics`;

export interface PantherlakeQueueReading {
  cameraId: string;
  queueLength: number;
  fps: number | null;
  receivedAt: number;
}

export interface PantherlakeBag {
  bagId: string;
  label: string;
  unattendedSeconds: number;
  alert: boolean;
}

export type BaggageAlertStatus = 'open' | 'executing' | 'resolved';

export interface PantherlakeBaggageAlert {
  id: string;
  cameraId: string;
  zoneLabel: string;
  raisedAt: number;
  updatedAt: number;
  /** Whether the camera is still reporting alert:true right now. */
  active: boolean;
  status: BaggageAlertStatus;
  bags: PantherlakeBag[];
}

interface PantherlakeState {
  connected: boolean;
  queues: Record<string, PantherlakeQueueReading>;
  baggageAlerts: PantherlakeBaggageAlert[];
  /** The alert currently shown as the corner popup, if any. */
  toastAlertId: string | null;
  /** Set when an operator follows a popup into the SOP Console. */
  focusAlertId: string | null;
  dismissToast: () => void;
  focusAlert: (id: string | null) => void;
  setAlertStatus: (id: string, status: BaggageAlertStatus) => void;
}

export const usePantherlakeStore = create<PantherlakeState>((set) => ({
  connected: false,
  queues: {},
  baggageAlerts: [],
  toastAlertId: null,
  focusAlertId: null,
  dismissToast: () => set({ toastAlertId: null }),
  focusAlert: (id) => set({ focusAlertId: id, toastAlertId: null }),
  setAlertStatus: (id, status) =>
    set((s) => ({ baggageAlerts: s.baggageAlerts.map((a) => (a.id === id ? { ...a, status } : a)) })),
}));

/** Which of Passenger Journey's existing checkpoints each queue camera feeds —
 *  "Zone A/B/C/D" (Pantherlake's own naming) land on seats that already exist
 *  on the platform rather than new UI being invented for them. */
export const PANTHERLAKE_ZONES: Array<{ cameraId: string; checkpointId: string; zoneLabel: string }> = [
  { cameraId: 'camera_01', checkpointId: 'terminal-entry', zoneLabel: 'Zone A' },
  { cameraId: 'camera_02', checkpointId: 'check-in', zoneLabel: 'Zone B' },
  { cameraId: 'camera_03', checkpointId: 'customs', zoneLabel: 'Zone C' },
  { cameraId: 'camera_04', checkpointId: 'airside', zoneLabel: 'Zone D' },
];

/** camera_01 → "Zone A", matching Pantherlake's zone_a..zone_d folders. */
function zoneLabelFor(cameraId: string): string {
  const n = Number(cameraId.replace(/\D/g, ''));
  return n >= 1 && n <= 26 ? `Zone ${String.fromCharCode(64 + n)}` : cameraId;
}

function handleQueue(msg: Record<string, unknown>) {
  if (typeof msg.camera_id !== 'string' || typeof msg.queue_length !== 'number') return;
  const cameraId = msg.camera_id;
  usePantherlakeStore.setState((s) => ({
    queues: {
      ...s.queues,
      [cameraId]: {
        cameraId,
        queueLength: msg.queue_length as number,
        fps: typeof msg.fps === 'number' ? msg.fps : null,
        receivedAt: Date.now(),
      },
    },
  }));
}

function parseBags(raw: unknown): PantherlakeBag[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b: Record<string, unknown>) => ({
    bagId: String(b.bag_id ?? ''),
    label: typeof b.label === 'string' ? b.label : 'bag',
    unattendedSeconds: typeof b.unattended_seconds === 'number' ? b.unattended_seconds : 0,
    alert: b.alert === true,
  }));
}

function handleBaggage(msg: Record<string, unknown>) {
  if (typeof msg.camera_id !== 'string') return;
  const cameraId = msg.camera_id;
  const alerting = msg.alert === true;
  const bags = parseBags(msg.bags);
  const now = Date.now();

  usePantherlakeStore.setState((s) => {
    // One unresolved alert per camera at a time: while one is still open,
    // further alert:true messages update it rather than raising a new popup.
    // Pantherlake's demo loops its clip, so without this every loop would
    // stack another alert for the same bag.
    const open = s.baggageAlerts.find((a) => a.cameraId === cameraId && a.status !== 'resolved');

    if (open) {
      return {
        baggageAlerts: s.baggageAlerts.map((a) =>
          a.id === open.id
            ? { ...a, active: alerting, updatedAt: now, bags: alerting ? bags : a.bags }
            : a
        ),
      };
    }

    if (!alerting) return {};

    const alert: PantherlakeBaggageAlert = {
      id: `${cameraId}-${now}`,
      cameraId,
      zoneLabel: zoneLabelFor(cameraId),
      raisedAt: now,
      updatedAt: now,
      active: true,
      status: 'open',
      bags,
    };
    return { baggageAlerts: [alert, ...s.baggageAlerts], toastAlertId: alert.id };
  });
}

let client: MqttClient | null = null;

/** Opens the MQTT connection the first time it's called; safe to call from
 *  every component that wants live data — subsequent calls are a no-op. */
export function ensurePantherlakeConnected(): void {
  if (client) return;

  client = mqtt.connect(BROKER_URL, {
    clientId: `uapoc-${Math.random().toString(16).slice(2)}`,
    reconnectPeriod: 3000,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  });

  client.on('connect', () => {
    usePantherlakeStore.setState({ connected: true });
    client?.subscribe([QUEUE_TOPIC, BAGGAGE_TOPIC]);
  });

  client.on('reconnect', () => usePantherlakeStore.setState({ connected: false }));
  client.on('close', () => usePantherlakeStore.setState({ connected: false }));
  client.on('error', () => usePantherlakeStore.setState({ connected: false }));

  client.on('message', (topic, payload) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(payload.toString());
    } catch {
      // A public test broker can carry noise — unparseable payloads are ignored.
      return;
    }
    if (topic.includes('/queue/')) handleQueue(msg);
    else if (topic.includes('/baggage/')) handleBaggage(msg);
  });
}
