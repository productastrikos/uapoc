/**
 * Shared depth-cue constants for the airfield plan.
 *
 * The plan is strictly 2D — there is no projection, no camera, no z axis. The
 * sense of relief comes entirely from treating the scene as if lit by a single
 * fixed source and drawing the consequences consistently: everything raised
 * casts a shadow the same way, every raised edge catches light on the same
 * side, and everything sitting on the ground gets a contact shadow beneath it.
 *
 * Consistency is what sells it. One object shaded against the convention reads
 * as a mistake rather than as depth.
 */

/**
 * Light comes from the north-west. Inside the world group the y axis points
 * north, so a shadow falls to the south-east: +x, −y.
 */
export const SUN = { x: 0.78, y: -0.62 };

/** Apparent height of each feature class, metres. Drives shadow length. */
export const HEIGHTS: Record<string, number> = {
  tower: 34,
  terminal: 16,
  hangar: 13,
  jet_bridge: 7,
  helipad: 0.5,
  aircraft: 11,
};

/** Shadow offset for a feature of the given apparent height. */
export function shadowOffset(height: number, factor = 0.9) {
  return { dx: SUN.x * height * factor, dy: SUN.y * height * factor };
}

/** Translate transform placing a feature's cast shadow. */
export function shadowTransform(height: number, factor = 0.9) {
  const o = shadowOffset(height, factor);
  return `translate(${o.dx} ${o.dy})`;
}

/**
 * Bloom profile per lighting category.
 *
 * A 20,000 cd approach light and a 200 cd taxiway centreline light should not
 * glow alike. Scaling the halo by real photometric output is both more accurate
 * and much cheaper than blooming every fixture equally, since the low-output
 * classes — which are also the most numerous — draw no extra geometry at all.
 */
export const BLOOM: Record<string, number> = {
  approach: 1.0,
  papi: 1.0,
  runway_edge: 0.85,
  runway_threshold: 0.85,
  runway_centerline: 0.7,
  runway_tdz: 0.7,
  runway_end: 0.5,
  stopbar: 0.4,
  taxiway_centerline: 0.28,
  taxiway_edge: 0.2,
  runway_guard: 0.4,
};
