/**
 * Settings, as a module like the others: its own item in the sidebar, its own
 * page in the content area.
 *
 * Everything here is saved in the browser (see useSettingsStore) and applied
 * immediately — there is no Save button to forget to press.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, RotateCcw, Settings, SlidersHorizontal, Type } from 'lucide-react';
import { useSettingsStore, TEXT_SCALE, type TextSize } from '../../store/useSettingsStore';
import { THEMES } from '../../theme/themes';

const TEXT_SIZES: Array<{ id: TextSize; label: string }> = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

const Section: React.FC<{ icon: React.ElementType; title: string; hint?: string; children: React.ReactNode }> = ({
  icon: Icon,
  title,
  hint,
  children,
}) => (
  <section className="glass-panel-strong rounded-xl p-4">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-accent-blue" />
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
    </div>
    {hint && <p className="text-xs text-text-muted mb-4">{hint}</p>}
    {!hint && <div className="mb-3" />}
    {children}
  </section>
);

const Toggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary-600/40 bg-primary-800/40 px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <p className="text-xs text-text-muted mt-0.5">{description}</p>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-10 h-6 rounded-full border transition-colors ${
        checked ? 'bg-accent-blue border-accent-blue' : 'bg-primary-700/60 border-primary-500/50'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const textSize = useSettingsStore((s) => s.textSize);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const showAlertPopups = useSettingsStore((s) => s.showAlertPopups);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setTextSize = useSettingsStore((s) => s.setTextSize);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const setShowAlertPopups = useSettingsStore((s) => s.setShowAlertPopups);
  const reset = useSettingsStore((s) => s.reset);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 h-full overflow-y-auto no-scrollbar"
    >
      {/* Header, in the same layout as the other modules */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-accent-blue/15 rounded-lg">
            <Settings className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-muted">Theme, text size and behaviour — saved in this browser and applied straight away</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={reset} className="btn btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Reset to defaults
          </button>
        </div>
      </div>

      <Section icon={Palette} title="Theme" hint="Pick a look. The platform itself stays on v1 — themes only change colours and style.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const selected = t.id === theme;
            return (
              <button
                key={t.id}
                disabled={!t.available}
                onClick={() => setTheme(t.id)}
                aria-pressed={selected}
                className={`relative text-left rounded-xl border p-3 transition-colors ${
                  selected
                    ? 'border-accent-blue bg-accent-blue/10'
                    : t.available
                    ? 'border-primary-600/50 bg-primary-800/40 hover:border-accent-blue/50'
                    : 'border-primary-600/30 bg-primary-800/20 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex h-9 rounded-lg overflow-hidden border border-white/10">
                  {t.swatches.map((c) => (
                    <span key={c} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-sm font-medium text-text-primary">{t.name}</span>
                  {selected && (
                    <span className="flex items-center justify-center rounded-full bg-accent-blue" style={{ width: 18, height: 18 }}>
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  {!t.available && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Coming soon</span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{t.description}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <Section icon={Type} title="Text size" hint="Scales text across the whole platform.">
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Text size">
            {TEXT_SIZES.map(({ id, label }) => (
              <button
                key={id}
                role="radio"
                aria-checked={textSize === id}
                onClick={() => setTextSize(id)}
                className={`chip flex-1 py-2 ${textSize === id ? 'chip-active' : ''}`}
              >
                <span style={{ fontSize: `${13 * TEXT_SCALE[id]}px` }}>Aa</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon={SlidersHorizontal} title="Behaviour">
          <div className="space-y-2.5">
            <Toggle
              label="Reduce animations"
              description="Turns off page transitions and moving effects."
              checked={reduceMotion}
              onChange={setReduceMotion}
            />
            <Toggle
              label="Live alert popups"
              description="The corner popup for Pantherlake alerts. Alerts still appear in the SOP Console when this is off."
              checked={showAlertPopups}
              onChange={setShowAlertPopups}
            />
          </div>
        </Section>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
