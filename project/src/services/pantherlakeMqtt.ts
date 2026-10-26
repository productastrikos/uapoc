/**
 * Live queue-length feed from the Pantherlake edge node, over MQTT.
 *
 * Pantherlake publishes per-camera queue analytics to a public MQTT broker
 * (broker.hivemq.com — see the "MQTT Local Test Setup" doc: proven working
 * end-to-end, but a public test broker, not for production) on
 *   astrikedge/{NODE_ID}/queue/cameras/{camera_id}/analytics
 * with a payload shaped like { camera_id, queue_length, fps, ... }.
 *
 * This connects once (lazily, the first time any screen asks for live data)
 * and keeps the latest reading per camera in a tiny zustand store. Swap
 * BROKER_URL for a private, authenticated broker before this goes anywhere
 * near a real deployment — the doc flags the same thing on the server side.
 */

import mqtt, { type MqttClient } from 'mqtt';
import { create } from 'zustand';

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
const NODE_ID = 'pantherlake01';
const TOPIC_PREFIX = 'astrikedge';
const QUEUE_TOPIC = `${TOPIC_PREFIX}/${NODE_ID}/queue/cameras/+/analytics`;

export interface PantherlakeQueueReading {
  cameraId: string;
  queueLength: number;
  fps: number | null;
  receivedAt: number;
}

interface PantherlakeState {
  connected: boolean;
  queues: Record<string, PantherlakeQueueReading>;
}

export const usePantherlakeStore = create<PantherlakeState>(() => ({
  connected: false,
  queues: {},
}));

/** Which of Passenger Journey's existing checkpoints each Pantherlake camera
 *  feeds — "Zone A/B/C/D" (Pantherlake's own naming) land on seats that
 *  already exist on the platform rather than new UI being invented for
 *  them. */
export const PANTHERLAKE_ZONES: Array<{ cameraId: string; checkpointId: string; zoneLabel: string }> = [
  { cameraId: 'camera_01', checkpointId: 'terminal-entry', zoneLabel: 'Zone A' },
  { cameraId: 'camera_02', checkpointId: 'check-in', zoneLabel: 'Zone B' },
  { cameraId: 'camera_03', checkpointId: 'customs', zoneLabel: 'Zone C' },
  { cameraId: 'camera_04', checkpointId: 'airside', zoneLabel: 'Zone D' },
];

let client: MqttClient | null = null;

/** Opens the MQTT connection the first time it's called; safe to call from
 *  every component that wants live data — subsequent calls are a no-op. */
export function ensurePantherlakeConnected(): void {
  if (client) return;

  client = mqtt.connect(BROKER_URL, {
    clientId: `uapoc-${Math.random().toString(16).slice(2)}`,
    reconnectPeriod: 3000,
  });

  client.on('connect', () => {
    usePantherlakeStore.setState({ connected: true });
    client?.subscribe(QUEUE_TOPIC);
  });

  client.on('reconnect', () => usePantherlakeStore.setState({ connected: false }));
  client.on('close', () => usePantherlakeStore.setState({ connected: false }));
  client.on('error', () => usePantherlakeStore.setState({ connected: false }));

  client.on('message', (_topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      if (typeof msg.camera_id !== 'string' || typeof msg.queue_length !== 'number') return;
      usePantherlakeStore.setState((s) => ({
        queues: {
          ...s.queues,
          [msg.camera_id]: {
            cameraId: msg.camera_id,
            queueLength: msg.queue_length,
            fps: typeof msg.fps === 'number' ? msg.fps : null,
            receivedAt: Date.now(),
          },
        },
      }));
    } catch {
      // A public test broker can carry noise/other apps' traffic on the
      // wildcard subscription — a payload that doesn't parse is just ignored.
    }
  });
}
