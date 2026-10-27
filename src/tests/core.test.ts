import { describe, it, expect } from 'vitest';
import { PetMachine } from '../engine/stateMachine/PetMachine';
import { Behavior } from '../engine/behavior/Behavior';
import { defaults, validateSettings } from '../stores/settings';
import { clampPosition, toLocal } from '../engine/physics/coordinates';
import type { CursorSample } from '../types';
const sample: CursorSample = { x: 900, y: 10, localX: 900, localY: 10, velocity: 0, stationaryMs: 0, idleMs: 0, fullscreen: false, battery: false, visible: true };
describe('action arbitration', () => {
  it('protects dragging from idle, system sleep, and click animations', () => { const m = new PetMachine(); m.request('DRAGGING', 'user', 0); expect(m.request('WAVING', 'idle', 20000)).toBe(false); expect(m.request('SLEEPING', 'system', 20001)).toBe(false); expect(m.request('JUMPING', 'user', 20002)).toBe(false); expect(m.request('IDLE', 'user', 20003)).toBe(true); });
  it('wakes before a queued user action and completes the action', () => { const m = new PetMachine(); m.request('SLEEPING', 'user', 0); m.request('WAVING', 'user', 10); expect(m.state).toBe('WAKING'); m.tick(2811); expect(m.state).toBe('WAVING'); m.tick(5500); expect(m.state).toBe('IDLE'); });
  it('does not let idle or system actions interrupt a user animation', () => { const m = new PetMachine(); m.request('DANCING', 'user', 0); expect(m.request('DRINKING_TEA', 'idle', 100)).toBe(false); expect(m.request('SLEEPING', 'system', 200)).toBe(false); m.tick(5500); expect(m.state).toBe('IDLE'); });
  it('pauses to a safe resting state and clears queued actions', () => { const m = new PetMachine(); m.request('JUMPING', 'user', 0); m.request('PAUSED', 'user', 100); expect(m.request('WAVING', 'user', 200)).toBe(false); m.resume(400); expect(m.state).toBe('IDLE'); });
  it('enforces spontaneous cooldowns', () => { const m = new PetMachine(); m.request('WAVING', 'idle', 0); m.tick(3000); expect(m.request('WAVING', 'idle', 4000)).toBe(false); expect(m.request('WAVING', 'idle', 17000)).toBe(true); });
});
describe('behavior and validation', () => {
  it('respects manual sleep while waking from automatic sleep', () => { const m = new PetMachine(); const b = new Behavior(() => .5); b.update(1000, m, defaults, { ...sample, idleMs: 301000 }); expect(m.state).toBe('SLEEPING'); b.update(2000, m, defaults, sample); expect(m.state).toBe('WAKING'); m.tick(5000); m.request('SLEEPING', 'user', 6000); b.update(7000, m, defaults, sample); expect(m.state).toBe('SLEEPING'); });
  it('uses deterministic scheduling and respects quiet mode', () => { const m = new PetMachine(); const b = new Behavior(() => 0); b.update(20000, m, defaults, sample); expect(m.state).toBe('SITTING'); const other = new PetMachine(); new Behavior(() => 0).update(20000, other, { ...defaults, quiet: true }, sample); expect(other.state).toBe('IDLE'); });
  it('clamps settings and orders inactivity thresholds', () => { const s = validateSettings({ size: NaN, particles: 999, sitAfter: 500, sleepAfter: 100, opacity: -1, outfit: 'bad' as 'sky' }); expect(s.size).toBe(1); expect(s.particles).toBe(32); expect(s.sleepAfter).toBe(500); expect(s.opacity).toBe(.3); expect(s.outfit).toBe('lavender'); });
});
describe('physical/logical coordinates', () => {
  it('handles negative virtual coordinates and fractional DPI', () => { expect(toLocal(-1600, -1920, 1.25, .8)).toBe(320); });
  it('recovers offscreen positions and oversized windows', () => { const area = { name: 'left', x: -1920, y: 0, width: 1920, height: 1040, scale: 1 }; expect(clampPosition(-2500, 1200, 320, 340, area)).toEqual({ x: -1920, y: 700 }); expect(clampPosition(0, 0, 4000, 4000, area)).toEqual({ x: -1920, y: 0 }); });
});
