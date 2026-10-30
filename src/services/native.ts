import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { defaults, initialStats, usePetStore, validateSettings } from '../stores/settings';
import type { Action, CursorSample, HitEllipse, MovementBounds, Persisted, Settings, Stats, WorkArea } from '../types';
export const native = isTauri();
export const previewReminder = (kind: number, customId?: string) => (native ? invoke<void>('preview_reminder', { kind, customId: customId ?? null }) : Promise.resolve(window.open(`?view=reminder&kind=${kind}${customId ? '&custom=' + encodeURIComponent(customId) : ''}`, 'mochi-reminder-preview', 'width=280,height=190')).then(() => {})).catch(reportError);
const previewKey = 'mochi-preview-v1';
export const cursor: CursorSample = { x: 160, y: 180, localX: 160, localY: 180, velocity: 0, stationaryMs: 0, idleMs: 0, fullscreen: false, battery: false, visible: true, typing: false };
const actions = new Set<(action: Action) => void>();
export const onAction = (fn: (action: Action) => void) => { actions.add(fn); return () => { actions.delete(fn); }; };
export async function action(action: Action) {
  if (native) await invoke('pet_action', { action });
  else actions.forEach(fn => fn(action));
}
export function reportError(e: unknown) { console.error(e); usePetStore.setState({ error: String(e) }); }
let saveQueue = Promise.resolve();
export function saveSettings(patch: Partial<Settings>) {
  saveQueue = saveQueue.catch(() => {}).then(async () => {
    const settings = validateSettings({ ...usePetStore.getState().settings, ...patch });
    if (native) await invoke('save_settings', { settings });
    else {
      const old = JSON.parse(localStorage.getItem(previewKey) || '{}');
      localStorage.setItem(previewKey, JSON.stringify({ ...old, settings }));
    }
    usePetStore.getState().setSettings(settings);
  });
  return saveQueue.catch(reportError);
}
export async function saveStats(stats: Stats) {
  if (native) await invoke('save_stats', { stats });
  else { const old = JSON.parse(localStorage.getItem(previewKey) || '{}'); localStorage.setItem(previewKey, JSON.stringify({ ...old, stats })); }
}
export async function command(name: 'show' | 'hide' | 'settings' | 'reset' | 'quit' | 'menu') {
  if (native) await invoke('window_command', { command: name });
  else if (name === 'settings') document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
}
export const setRegions = (regions: HitEllipse[]) => native ? invoke<void>('set_hit_regions', { regions }) : Promise.resolve();
export const dropPet = () => native ? invoke<void>('drop_pet') : Promise.resolve().then(() => {
  window.dispatchEvent(new CustomEvent('mochi-fall-motion', { detail: 'falling' }));
  window.setTimeout(() => window.dispatchEvent(new CustomEvent('mochi-fall-motion', { detail: 'landed' })), 1200);
});
export const beginDrag = () => native ? invoke<void>('begin_drag') : Promise.resolve();
export const endDrag = () => native ? invoke<void>('end_drag') : Promise.resolve();
export const movePet = (dx: number, dy: number, returning = false, wall = false) => native ? invoke<void>('move_pet', { dx, dy, returning, wall }) : Promise.resolve();
export const movementBounds = () => native ? invoke<MovementBounds>('movement_bounds') : Promise.resolve({ left: -180, right: 12, top: -400, bottom: 0 });
export const monitors = () => native ? invoke<WorkArea[]>('get_monitors') : Promise.resolve([{ name: 'Browser preview', x: 0, y: 0, width: 1920, height: 1080, scale: 1 }]);
export async function connect() {
  const cleanups: (() => void)[] = [];
  if (native) {
    cleanups.push(await listen<Settings>('settings-changed', e => usePetStore.getState().setSettings(validateSettings(e.payload))));
    cleanups.push(await listen<Stats>('stats-changed', e => usePetStore.getState().setStats(e.payload)));
    cleanups.push(await listen<CursorSample>('cursor', e => Object.assign(cursor, e.payload)));
    cleanups.push(await listen<Action>('action', e => actions.forEach(fn => fn(e.payload))));
    cleanups.push(await listen<string>('fall-motion', e => { if (['falling','landed'].includes(e.payload)) window.dispatchEvent(new CustomEvent('mochi-fall-motion', { detail:e.payload })); }));
    cleanups.push(await listen('drag-ended', () => window.dispatchEvent(new Event('mochi-drag-ended'))));
    cleanups.push(await listen('position-reset', () => window.dispatchEvent(new Event('mochi-position-reset'))));
    cleanups.push(await listen<string>('native-error', e => reportError(e.payload)));
    cleanups.push(await listen<{ state: import('../types').PetState }>('status', e => usePetStore.setState(e.payload)));
  }
  try {
    const persisted: Persisted = native ? await invoke('load_settings') : JSON.parse(localStorage.getItem(previewKey) || 'null') ?? { settings: defaults, stats: initialStats, position: null };
    usePetStore.setState({ settings: validateSettings(persisted.settings), stats: persisted.stats, ready: true });
  } catch (e) { reportError(e); usePetStore.setState({ ready: true }); }
  return () => cleanups.forEach(fn => fn());
}
export const publishState = (state: import('../types').PetState) => { if (native) invoke('publish_status', { state }).catch(reportError); };
