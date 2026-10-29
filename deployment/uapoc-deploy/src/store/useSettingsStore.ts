/**
 * User preferences from the Settings panel. Saved in the browser
 * (localStorage), so they survive a refresh and come back next visit — they
 * are per browser, not per account.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME, isThemeAvailable, type ThemeId } from '../theme/themes';

export type TextSize = 'small' | 'default' | 'large';

/** Multiplier applied on top of every region's own type scale (see --fs-scale). */
export const TEXT_SCALE: Record<TextSize, number> = {
  small: 0.92,
  default: 1,
  large: 1.1,
};

interface SettingsState {
  theme: ThemeId;
  textSize: TextSize;
  /** Switches off CSS and Framer Motion animations. */
  reduceMotion: boolean;
  /** The corner popup for live Pantherlake alerts. The alerts themselves still
   *  arrive in the SOP Console either way. */
  showAlertPopups: boolean;

  setTheme: (theme: ThemeId) => void;
  setTextSize: (size: TextSize) => void;
  setReduceMotion: (on: boolean) => void;
  setShowAlertPopups: (on: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  theme: DEFAULT_THEME,
  textSize: 'default' as TextSize,
  reduceMotion: false,
  showAlertPopups: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      // A theme that isn't built yet can't be selected, even from stale saved data.
      setTheme: (theme) => set((s) => ({ theme: isThemeAvailable(theme) ? theme : s.theme })),
      setTextSize: (textSize) => set({ textSize }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setShowAlertPopups: (showAlertPopups) => set({ showAlertPopups }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'uapoc-settings',
      partialize: (s) => ({
        theme: s.theme,
        textSize: s.textSize,
        reduceMotion: s.reduceMotion,
        showAlertPopups: s.showAlertPopups,
      }),
      // Saved data from an older version, or a theme that is no longer offered,
      // falls back to the default rather than breaking the page.
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          theme: s.theme && isThemeAvailable(s.theme) ? s.theme : DEFAULTS.theme,
          textSize: s.textSize && s.textSize in TEXT_SCALE ? s.textSize : DEFAULTS.textSize,
          reduceMotion: typeof s.reduceMotion === 'boolean' ? s.reduceMotion : DEFAULTS.reduceMotion,
          showAlertPopups: typeof s.showAlertPopups === 'boolean' ? s.showAlertPopups : DEFAULTS.showAlertPopups,
        };
      },
    }
  )
);

/** Writes the settings onto the page: theme and motion as attributes on
 *  <html>, text size as the --fs-scale variable the type scale multiplies by. */
export function applySettingsToDocument(s: Pick<SettingsState, 'theme' | 'textSize' | 'reduceMotion'>) {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  root.dataset.reduceMotion = String(s.reduceMotion);
  root.style.setProperty('--fs-scale', String(TEXT_SCALE[s.textSize]));
}
