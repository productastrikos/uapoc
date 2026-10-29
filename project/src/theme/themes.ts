/**
 * The themes the Settings panel offers.
 *
 * "Version 1" is the look the platform has today — the blue-glass design, the
 * near-black cards, the status-colour rules. It is the baseline: it needs no
 * overrides, so selecting it simply means no `[data-theme]` rule applies.
 *
 * The active theme id is written to `<html data-theme="…">`. A future theme
 * is added by (1) giving it an entry here with `available: true`, and
 * (2) scoping every one of its style changes under `[data-theme="<id>"]` in
 * CSS, so Version 1 keeps rendering exactly as it does now. A theme that edits
 * the base styles directly would overwrite Version 1 instead of sitting next to
 * it.
 */

export type ThemeId = 'v1' | 'v2' | 'v3' | 'v4';

/** The platform's own version, shown in the header and on the login page. It
 *  is independent of the theme: "Version 3" is a look, not a release. */
export const PLATFORM_VERSION = 'v1';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  /** Three swatches for the picker: page background, panel/accent, highlight. */
  swatches: [string, string, string];
  /** False for a theme that is planned but not built yet. */
  available: boolean;
}

/* The `id` is what the CSS is scoped to ([data-theme="<id>"]) and what is saved
 * in the browser; the `name` is what people see. The two differ on purpose: the
 * original deep-navy look keeps the CSS id "v1" (so it needed no changes) but is
 * presented as Version 4, and the light blue theme is the new Version 1. */
export const THEMES: ThemeDefinition[] = [
  {
    id: 'v2',
    name: 'Version 1',
    description: 'Light and minimal — frosted white glass over soft blue.',
    swatches: ['#EAF2FC', '#2173E0', '#FFFFFF'],
    available: true,
  },
  {
    id: 'v4',
    name: 'Version 2',
    description: 'Mocha — warm sand and glass with roasted-brown accents.',
    swatches: ['#E1D4C2', '#6E473B', '#291C0E'],
    available: true,
  },
  {
    id: 'v3',
    name: 'Version 3',
    description: 'Dusk — deep indigo and plum with a warm amber accent.',
    swatches: ['#1D1A39', '#451952', '#F39F5A'],
    available: true,
  },
  {
    id: 'v1',
    name: 'Version 4',
    description: 'The original look — deep navy with blue glass panels.',
    swatches: ['#000521', '#2078CF', '#C1E8FF'],
    available: true,
  },
];

export const DEFAULT_THEME: ThemeId = 'v2';

export const isThemeAvailable = (id: string): id is ThemeId =>
  THEMES.some((t) => t.id === id && t.available);
