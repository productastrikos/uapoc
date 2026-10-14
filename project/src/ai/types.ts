/**
 * Cross-module AI advisory model.
 *
 * Every module used to grow its own AI panel with its own shape, so "AI" meant
 * something different on each screen and none of them could answer the question
 * the customer actually asks in the room: *what* is the AI, *what did it see*,
 * and *what happens if I press the button*.
 *
 * One model answers all three. An insight carries the observation, the signals
 * behind it, the named technique, the systems the inference consumed and the
 * action it prescribes — so a recommendation can be defended, not just admired.
 *
 * The framing follows the Astrikos S!aP loop already used on the AOCC screen:
 *
 *   Sense      → detect   — something is wrong now
 *   Interpret  → predict  — something will be wrong shortly
 *   Act        → prescribe— here is the SOP to run
 *   Predict    → optimise — nothing is wrong; here is money on the table
 */

/** Which console an insight belongs to. */
export type AiDomain =
  | 'aocc'
  | 'airside'
  | 'agl'
  | 'apron'
  | 'terminal'
  | 'bms'
  | 'landside'
  | 'security'
  | 'maintenance'
  | 'commercial'
  | 'sustainability'
  | 'passenger'
  | 'analytics';

/**
 * What the model is doing, not what it is about.
 *
 * Drives the accent colour and the verb on the card, so an operator can tell a
 * live fault from a revenue opportunity without reading the body text.
 */
export type AiClass = 'detect' | 'predict' | 'prescribe' | 'optimise';

export type AiSeverity = 'critical' | 'warning' | 'opportunity';

export interface AiInsight {
  id: string;
  domain: AiDomain;
  kind: AiClass;
  severity: AiSeverity;
  title: string;
  /** One line: what the model observed or expects. */
  observation: string;
  /**
   * The same thing said plainly, for the default view.
   *
   * `observation` is written for an engineer — megohms, serviceability targets,
   * decay rates. That is the right register once somebody is deciding, and the
   * wrong one for the first line they read. When this is set the card leads
   * with it and keeps the technical wording behind Details; when it is not, the
   * observation stands in.
   */
  plain?: string;
  /** The signals that produced it — shown behind the "Why this?" disclosure. */
  evidence: string[];
  /** What the operator should do about it. */
  recommendation: string;
  /** Quantified benefit of acting, or cost of not. */
  impact: string;
  /** Model confidence, 0–100. */
  confidence: number;
  /** How far ahead the inference reaches, e.g. `next 40 min`. */
  horizon: string;
  /** Named technique, so "what AI?" has an answer. */
  model: string;
  /** Upstream systems the inference consumed. */
  sources: string[];
  /** Label on the primary button. */
  action: string;
  /** Toast body once the action is accepted. */
  outcome: string;
  /**
   * Side effect to run when the operator accepts.
   *
   * Catalogue entries leave this unset — accepting them logs the decision and
   * nothing more, which is honest for a scenario the platform is not wired
   * into. A console that computes its own insights from live tags can supply
   * one so that accepting actually raises the work order it is recommending.
   */
  run?: () => void;
}

/** Operator disposition of an insight, held in the store. */
export type AiDisposition = 'pending' | 'accepted' | 'shadow' | 'dismissed';

export const DOMAIN_LABEL: Record<AiDomain, string> = {
  aocc: 'U-APOC',
  airside: 'Airside',
  agl: 'Airfield Lighting',
  apron: 'Apron',
  terminal: 'Terminal',
  bms: 'Building Management',
  landside: 'Landside',
  security: 'Security',
  maintenance: 'Maintenance',
  commercial: 'Commercial',
  sustainability: 'Sustainability',
  passenger: 'Passenger',
  analytics: 'Analytics',
};

export const CLASS_LABEL: Record<AiClass, string> = {
  detect: 'Detect',
  predict: 'Predict',
  prescribe: 'Prescribe',
  optimise: 'Optimise',
};
