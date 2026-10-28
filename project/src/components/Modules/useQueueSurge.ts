/**
 * Queue-surge simulation for the Passenger Journey checkpoint cards.
 *
 * Six of the ten checkpoints (the ones NOT fed by Pantherlake) are given a
 * capacity and each run a repeating cycle:
 *
 *   idle → rising (queue climbs by 1 at a time to the critical line) →
 *   critical (waits for the operator) → SOP executed (queue relieved, change
 *   shown on the card) → after a hold the card returns to its fresh baseline
 *   and starts over.
 *
 * Only one card — the "lead" — climbs at a decent pace (`leadStepMs` per +1).
 * Every other card crawls (`slowStepMs`, ~20s per +1), so something is always
 * moving without the whole board racing to red. When the lead card is relieved
 * and resets, the next card in order becomes the lead.
 *
 * Status is derived from queue ÷ capacity, so "full" finally means something.
 * Wait time and SLA are derived from the same fill, so the whole card degrades
 * and recovers together instead of only the queue number moving.
 *
 * The four Pantherlake-fed checkpoints keep their live queue; running an SOP
 * on them records the measure but cannot move a number that a camera owns.
 *
 * Runs only while the page using the hook is mounted.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SopId = 'fast-track' | 'inflow-metering' | 'offload' | 'snake';
export type CheckpointStatus = 'optimal' | 'congested' | 'critical';
export type SurgePhase = 'idle' | 'rising' | 'critical' | 'relieved';

export interface SopOption {
  id: SopId;
  name: string;
  /** Short label for the card strip. */
  short: string;
  description: string;
  /** Share of the current queue this removes, at full fit. */
  queueCut: number;
  /** Share of capacity this adds, at full fit. */
  capGain: number;
}

export const SOP_OPTIONS: SopOption[] = [
  {
    id: 'fast-track',
    name: 'Priority Paging / Fast-Tracking',
    short: 'Fast-tracking',
    description:
      'Marshals walk the queue for passengers whose flights board in the next 15–30 minutes and move them to an express lane or the front. Stops missed flights and offloaded baggage.',
    queueCut: 0.55,
    capGain: 0,
  },
  {
    id: 'inflow-metering',
    name: 'Inflow Metering',
    short: 'Inflow metering',
    description:
      'Staff hold passengers at the doors or before the escalators in a controlled holding zone, so crowds do not block walkways, emergency exits and retail areas.',
    queueCut: 0.4,
    capGain: 0,
  },
  {
    id: 'offload',
    name: 'Remote Offloading',
    short: 'Remote offloading',
    description:
      'Shift work away from the bottleneck: hand-luggage passengers to self-service kiosks, baggage check-in to curbside or parking. Fewer people enter the main queue.',
    queueCut: 0.5,
    capGain: 0,
  },
  {
    id: 'snake',
    name: 'Snake Queue Reconfiguration',
    short: 'Snake queue',
    description:
      'Re-tape the stanchions into a winding serpentine over open floor, adding queuing capacity on the spot without extra staff.',
    queueCut: 0.1,
    capGain: 0.5,
  },
];

interface SurgeCardConfig {
  baseline: number;
  capacity: number;
  /** Wait time (min) when the queue is exactly at capacity. */
  maxWaitMin: number;
  /** ms per +1 while this card is the lead (the one climbing at a decent pace). */
  leadStepMs: number;
  /** ms per +1 while it is not the lead — a slow crawl. Differs per card so
   *  the crawling cards never tick together. */
  slowStepMs: number;
  recommended: SopId;
  reason: string;
}

// Lead pace is tuned per card so each takes roughly 2–3 minutes to reach its
// limit (steps to the critical line × leadStepMs); the crawl is ~20s per +1.
export const SURGE_CARDS: Record<string, SurgeCardConfig> = {
  'baggage-drop': {
    baseline: 14, capacity: 50, maxWaitMin: 24, leadStepMs: 4_500, slowStepMs: 22_000, recommended: 'offload',
    reason: 'A volume problem — moving drop-off to kiosks and curbside takes people out of the queue.',
  },
  security: {
    baseline: 18, capacity: 70, maxWaitMin: 25, leadStepMs: 3_500, slowStepMs: 26_000, recommended: 'fast-track',
    reason: 'Time-critical — pulling out passengers whose flights board soon protects departures.',
  },
  immigration: {
    baseline: 10, capacity: 45, maxWaitMin: 20, leadStepMs: 4_500, slowStepMs: 20_000, recommended: 'snake',
    reason: 'A hall with open floor space — a serpentine layout adds capacity with no extra staff.',
  },
  'boarding-gate': {
    baseline: 22, capacity: 90, maxWaitMin: 18, leadStepMs: 3_000, slowStepMs: 18_000, recommended: 'fast-track',
    reason: 'Flights are about to close — fast-tracking the nearest departures comes first.',
  },
  'aircraft-entry': {
    baseline: 6, capacity: 30, maxWaitMin: 15, leadStepMs: 6_000, slowStepMs: 28_000, recommended: 'inflow-metering',
    reason: 'Crowding at the jet bridge — holding passengers back keeps the approach clear.',
  },
  'cabin-process': {
    baseline: 4, capacity: 40, maxWaitMin: 12, leadStepMs: 4_500, slowStepMs: 24_000, recommended: 'inflow-metering',
    reason: 'Boarding density — metering the inflow stops the aisle backing up.',
  },
};

export const isSurgeCard = (id: string) => id in SURGE_CARDS;
export const recommendedSopFor = (id: string): SopId | undefined => SURGE_CARDS[id]?.recommended;
export const recommendationReason = (id: string) => SURGE_CARDS[id]?.reason;

export const FILL_CONGESTED = 0.6;
export const FILL_CRITICAL = 0.85;

/** How well an SOP suits a card: the recommended one at full strength. */
const OFF_FIT = 0.6;
const fitFor = (cardId: string, sopId: SopId) => (SURGE_CARDS[cardId]?.recommended === sopId ? 1 : OFF_FIT);

const ANIM_MS = 4_000;
const HOLD_MS = 35_000;
/** Pause between a card resetting and it starting to rise again. */
const RESTART_GAP_MS = 6_000;
/** How long after the page opens before the cards start moving. */
const INITIAL_DELAY_MS = 2_000;
const TICK_MS = 1_000;

const statusForFill = (fill: number): CheckpointStatus =>
  fill >= FILL_CRITICAL ? 'critical' : fill >= FILL_CONGESTED ? 'congested' : 'optimal';

const waitFor = (id: string, queue: number, capacity: number) =>
  Math.max(1, Math.round((queue / capacity) * SURGE_CARDS[id].maxWaitMin));

const slaFor = (fill: number) => Math.round(Math.max(40, 99 - 45 * fill * fill));

/** What an SOP would do to a card's queue/capacity right now. */
export function sopPreview(cardId: string, sopId: SopId) {
  const sop = SOP_OPTIONS.find((s) => s.id === sopId)!;
  const fit = fitFor(cardId, sopId);
  return { queueCutPct: Math.round(sop.queueCut * fit * 100), capGainPct: Math.round(sop.capGain * fit * 100) };
}

export interface SopRecord {
  sopId: SopId;
  name: string;
  short: string;
  /** True for Pantherlake-owned cards: the numbers below are not meaningful. */
  live: boolean;
  startedAt: number;
  resetAt: number;
  queueFrom: number;
  queueTo: number;
  capFrom: number;
  capTo: number;
  waitFrom: number;
  waitTo: number;
}

export interface CardSurge {
  phase: SurgePhase;
  queue: number;
  capacity: number;
  baseline: number;
  fill: number;
  waitMin: number;
  slaCompliance: number;
  status: CheckpointStatus;
  sop: SopRecord | null;
}

/** Where a card is in its own cycle. 'relieved' lasts while an SOP is active. */
type Stage = 'gap' | 'rising' | 'critical' | 'relieved';
interface CardSim {
  queue: number;
  capacity: number;
  sop: SopRecord | null;
  stage: Stage;
  /** When the current stage began. */
  since: number;
  /** Progress towards the next +1, accumulated tick by tick so the pace can
   *  change mid-climb when the lead passes to another card. */
  steps: number;
  /** When the queue last crept up while sitting at critical. */
  lastCreep: number;
}

const ALL_IDS = Object.keys(SURGE_CARDS);

interface Options {
  /** Pantherlake-owned checkpoints, which can take an SOP but not a queue change. */
  liveCardIds: string[];
  onCritical?: (cardId: string, recommended: SopId) => void;
  onReset?: (cardId: string, sopName: string) => void;
}

export function useQueueSurge({ liveCardIds, onCritical, onReset }: Options) {
  const callbacks = useRef({ onCritical, onReset });
  callbacks.current = { onCritical, onReset };

  const simRef = useRef<{ cards: Record<string, CardSim>; leadIdx: number; lastTickAt: number } | null>(null);
  if (!simRef.current) {
    const now = Date.now();
    const cards: Record<string, CardSim> = {};
    ALL_IDS.forEach((id) => {
      const cfg = SURGE_CARDS[id];
      cards[id] = {
        queue: cfg.baseline, capacity: cfg.capacity, sop: null,
        // Backdated so the first gap lasts exactly INITIAL_DELAY_MS.
        stage: 'gap', since: now - RESTART_GAP_MS + INITIAL_DELAY_MS, steps: 0, lastCreep: 0,
      };
    });
    liveCardIds.forEach((id) => {
      cards[id] = { queue: 0, capacity: 0, sop: null, stage: 'gap', since: now, steps: 0, lastCreep: 0 };
    });
    simRef.current = { cards, leadIdx: 0, lastTickAt: now };
  }

  const buildSnapshot = useCallback(() => {
    const sim = simRef.current!;
    const cards: Record<string, CardSurge> = {};
    ALL_IDS.forEach((id) => {
      const c = sim.cards[id];
      const fill = c.queue / c.capacity;
      const phase: SurgePhase = c.sop
        ? 'relieved'
        : c.stage === 'rising'
        ? 'rising'
        : c.stage === 'critical'
        ? 'critical'
        : 'idle';
      cards[id] = {
        phase,
        queue: c.queue,
        capacity: c.capacity,
        baseline: SURGE_CARDS[id].baseline,
        fill,
        waitMin: waitFor(id, c.queue, c.capacity),
        slaCompliance: slaFor(fill),
        status: statusForFill(fill),
        sop: c.sop,
      };
    });
    const liveSops: Record<string, SopRecord> = {};
    liveCardIds.forEach((id) => { const s = sim.cards[id]?.sop; if (s) liveSops[id] = s; });
    return { cards, liveSops };
  // liveCardIds is a stable module-level list at the call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [snapshot, setSnapshot] = useState(buildSnapshot);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const sim = simRef.current!;
      // Capped, so a throttled background tab doesn't jump the queues on return.
      const dt = Math.min(now - sim.lastTickAt, TICK_MS * 2);
      sim.lastTickAt = now;

      // SOP animation and expiry, for every card.
      [...ALL_IDS, ...liveCardIds].forEach((id) => {
        const c = sim.cards[id];
        const s = c?.sop;
        if (!s) return;
        if (now >= s.resetAt) {
          c.sop = null;
          if (!s.live) {
            c.queue = SURGE_CARDS[id].baseline;
            c.capacity = SURGE_CARDS[id].capacity;
          }
          callbacks.current.onReset?.(id, s.name);
          // Fresh again: a short pause, then it starts rising once more.
          c.stage = 'gap';
          c.since = now;
          c.steps = 0;
          // A relieved lead hands the lead to the next card in order.
          if (ALL_IDS[sim.leadIdx] === id) sim.leadIdx = (sim.leadIdx + 1) % ALL_IDS.length;
        } else if (!s.live) {
          const t = Math.min(1, Math.max(0, (now - s.startedAt) / ANIM_MS));
          c.queue = Math.round(s.queueFrom + (s.queueTo - s.queueFrom) * t);
          c.capacity = Math.round(s.capFrom + (s.capTo - s.capFrom) * t);
        }
      });

      // Every surge card runs its own cycle: the lead at a decent pace, the
      // rest crawling.
      ALL_IDS.forEach((id) => {
        const cfg = SURGE_CARDS[id];
        const card = sim.cards[id];
        if (card.sop) return; // relieved: the SOP branch above owns the numbers
        const stepMs = ALL_IDS[sim.leadIdx] === id ? cfg.leadStepMs : cfg.slowStepMs;

        if (card.stage === 'gap') {
          if (now - card.since >= RESTART_GAP_MS) { card.stage = 'rising'; card.since = now; card.steps = 0; }
        } else if (card.stage === 'rising') {
          // One person at a time: +1 per stepMs, not a smooth slide.
          const target = Math.ceil(cfg.capacity * FILL_CRITICAL);
          card.steps += dt / stepMs;
          card.queue = Math.min(target, cfg.baseline + Math.floor(card.steps));
          if (card.queue >= target) {
            card.stage = 'critical';
            card.since = now;
            card.lastCreep = now;
            callbacks.current.onCritical?.(id, cfg.recommended);
          }
        } else if (card.stage === 'critical') {
          // Keeps creeping while it waits, at half the rising pace, so a card
          // left alone keeps getting worse.
          if (now - card.lastCreep >= stepMs * 2 && card.queue < card.capacity) {
            card.queue += 1;
            card.lastCreep = now;
          }
        }
      });

      setSnapshot(buildSnapshot());
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  // liveCardIds is a stable module-level list at the call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildSnapshot]);

  const executeSop = useCallback((cardId: string, sopId: SopId): SopRecord | null => {
    const sim = simRef.current!;
    const c = sim.cards[cardId];
    const sop = SOP_OPTIONS.find((s) => s.id === sopId);
    if (!c || !sop || c.sop) return null;

    const now = Date.now();
    const live = !isSurgeCard(cardId);
    let record: SopRecord;

    if (live) {
      record = {
        sopId, name: sop.name, short: sop.short, live: true,
        startedAt: now, resetAt: now + ANIM_MS + HOLD_MS,
        queueFrom: 0, queueTo: 0, capFrom: 0, capTo: 0, waitFrom: 0, waitTo: 0,
      };
    } else {
      const fit = fitFor(cardId, sopId);
      const queueTo = Math.max(0, Math.round(c.queue * (1 - sop.queueCut * fit)));
      const capTo = Math.round(c.capacity * (1 + sop.capGain * fit));
      record = {
        sopId, name: sop.name, short: sop.short, live: false,
        startedAt: now, resetAt: now + ANIM_MS + HOLD_MS,
        queueFrom: c.queue, queueTo, capFrom: c.capacity, capTo,
        waitFrom: waitFor(cardId, c.queue, c.capacity),
        waitTo: waitFor(cardId, queueTo, capTo),
      };
    }

    c.sop = record;
    // Relieving a card that is mid-surge ends that surge; it starts over
    // once the SOP has run its course and the card has reset.
    if (c.stage === 'rising' || c.stage === 'critical') {
      c.stage = 'relieved';
      c.since = now;
    }
    setSnapshot(buildSnapshot());
    return record;
  }, [buildSnapshot]);

  return { cards: snapshot.cards, liveSops: snapshot.liveSops, executeSop };
}
