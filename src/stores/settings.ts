import { create } from 'zustand';
import type { Settings, Stats, PetState } from '../types';
export const defaults: Settings = {
  character: 'mochi', climate: 'auto',
  size: 1, outfit: 'lavender', speed: 1, sensitivity: 1, pip: true, opacity: 1,
  alwaysOnTop: true, reducedMotion: false, particles: 18, theme: 'cream', autoSleep: true,
  randomActions: true, followCursor: true, interactions: true, quiet: false, stats: true,
  workAlong: true, adventures: true, fullScreenRoam: true,
  startup: false, clickThrough: false, monitor: 0, fullscreenPause: true, batterySaver: false,
  muted: true, volume: 0.2, calmAfter: 30, sitAfter: 120, sleepAfter: 300,
  snapEdges: true, playRadius: 180,
  waterReminders: true, waterInterval: 45, stretchReminders: false, stretchInterval: 60,
  eyeReminders: false, eyeInterval: 30, customReminders: [],
};
export const initialStats: Stats = { happiness: 75, energy: 80, affection: 50 };
export function validateSettings(input: Partial<Settings>): Settings {
  const s = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    const v = input[key];
    if (typeof v === typeof defaults[key] && (typeof v !== 'number' || Number.isFinite(v))) Object.assign(s, { [key]: v });
  }
  const limits: Partial<Record<keyof Settings, [number, number]>> = { size: [.65, 1.6], speed: [.5, 1.8], sensitivity: [.3, 2], opacity: [.3, 1], particles: [0, 32], monitor: [0, 32], volume: [0, 1], calmAfter: [10, 600], sitAfter: [30, 1800], sleepAfter: [60, 7200], playRadius: [30, 400] };
  for (const [key, [min, max]] of Object.entries(limits)) Object.assign(s, { [key]: Math.min(max, Math.max(min, s[key as keyof Settings] as number)) });
  s.sitAfter = Math.max(s.calmAfter, s.sitAfter); s.sleepAfter = Math.max(s.sitAfter, s.sleepAfter);
  if (!['lavender', 'peach', 'sky'].includes(s.outfit)) s.outfit = defaults.outfit;
  if (!['cream', 'dusk'].includes(s.theme)) s.theme = defaults.theme;
  if (!['mochi', 'walle', 'olaf', 'spiderman', 'luffy'].includes(s.character)) s.character = defaults.character;
  if (!['off', 'auto', 'sunny', 'rain', 'snow', 'wind'].includes(s.climate)) s.climate = defaults.climate;
  s.monitor = Math.round(s.monitor); s.particles = Math.round(s.particles);
  for (const key of ['waterInterval', 'stretchInterval', 'eyeInterval'] as const) s[key] = Math.round(Math.min(240, Math.max(10, s[key])));
  const ids = new Set<string>();
  s.customReminders = (Array.isArray(input.customReminders) ? input.customReminders : []).filter(r => {
    if (!r || typeof r.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(r.id) || ids.has(r.id)) return false;
    ids.add(r.id); return true;
  }).slice(0, 10).map(r => ({
    id: r.id, title: Array.from(typeof r.title === 'string' ? r.title.trim() : '').slice(0,32).join('') || 'A little reminder',
    message: Array.from(typeof r.message === 'string' ? r.message.trim() : '').slice(0,80).join(''),
    interval: Math.round(Math.max(5, Math.min(1440, Number.isFinite(r.interval) ? r.interval : 60))),
    enabled: r.enabled === true, style: ['water','stretch','eyes'].includes(r.style) ? r.style : 'eyes',
  }));
  return s;
}
interface Store { settings: Settings; stats: Stats; state: PetState; error: string | null; ready: boolean;
  setSettings: (s: Settings) => void; setStats: (s: Stats) => void;
}
export const usePetStore = create<Store>((set) => ({ settings: defaults, stats: initialStats, state: 'IDLE', error: null, ready: false, setSettings: settings => set({ settings }), setStats: stats => set({ stats }) }));
