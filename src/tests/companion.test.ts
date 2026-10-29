import { describe, it, expect } from 'vitest';
import { adventure, tripSeconds } from '../engine/physics/adventures';
import { PetMachine } from '../engine/stateMachine/PetMachine';
import { Behavior } from '../engine/behavior/Behavior';
import { defaults } from '../stores/settings';
import type { CursorSample, PetState } from '../types';

const cursor: CursorSample = { x: 0, y: 0, localX: 800, localY: 0, velocity: 0, stationaryMs: 0, idleMs: 0, fullscreen: false, battery: false, visible: true, typing: true };
describe('companion behavior boundaries', () => {
  it('takes swings, rocket jumps, and playtime across the available screen width', () => {
    const bounds = { left: -1400, right: 280, top: -700, bottom: 60 };
    for (const state of ['WEB_SWINGING', 'GUM_ROCKET', 'PLAYING'] as PetState[]) {
      for (const variant of [0, 1]) {
        const points = Array.from({ length: 721 }, (_, i) => adventure(state, i / 720 * tripSeconds[state]!, bounds, 150, true, variant));
        expect(Math.min(...points.map(p => p.x))).toBeCloseTo(bounds.left, 0);
        expect(Math.max(...points.map(p => p.x))).toBeCloseTo(bounds.right, 0);
        if (state !== 'PLAYING') expect(Math.min(...points.map(p => p.y))).toBeCloseTo(bounds.top, 0);
        const local = Array.from({ length: 73 }, (_, i) => adventure(state, i / 72 * tripSeconds[state]!, bounds, 150, false, variant));
        expect(local.every(p => Math.abs(p.x) <= 150 && Math.abs(p.y) <= 150)).toBe(true);
      }
    }
  });
  it('crosses the top during ceiling patrol and stops to inspect treasures', () => {
    const b = { left: -900, right: 100, top: -500, bottom: 70 };
    expect(adventure('CEILING_CRAWLING', 11, b, 180, true)).toMatchObject({ x: b.right, y: b.top, ceiling: 1 });
    expect(adventure('CEILING_CRAWLING', 21, b, 180, true)).toMatchObject({ x: b.left, y: b.top, ceiling: 1 });
    expect(adventure('TREASURE_PATROL', 7, b, 180, true)).toMatchObject({ x: b.left, y: b.bottom });
    expect(adventure('TREASURE_PATROL', 9, b, 180, true)).toMatchObject({ x: b.left, y: b.bottom });
  });
  it('keeps every route inside available space and returns exactly home', () => {
    for (const bounds of [{ left: -1200, right: 12, top: -350, bottom: 0 }, { left: 0, right: 900, top: -25, bottom: 300 }]) {
      for (const [state, end] of Object.entries(tripSeconds) as [PetState, number][]) {
        for (let t = 0; t <= end; t += .1) {
          const p = adventure(state, t, bounds, 180, true);
          expect(p.x).toBeGreaterThanOrEqual(bounds.left); expect(p.x).toBeLessThanOrEqual(bounds.right);
          expect(p.y).toBeGreaterThanOrEqual(bounds.top); expect(p.y).toBeLessThanOrEqual(bounds.bottom);
        }
        const home = adventure(state, end, bounds, 180, true);
        expect(home.x).toBeCloseTo(0); expect(home.y).toBeCloseTo(0);
      }
    }
  });
  it('uses the full work area and reveals hidden Mochi automatically', () => {
    const b = { left: -1400, right: 300, top: -550, bottom: 100 };
    const points = Array.from({ length: 361 }, (_, i) => adventure('EXPLORING', i / 10, b, 180, true));
    expect(Math.min(...points.map(p => p.x))).toBeCloseTo(b.left, 0);
    expect(Math.max(...points.map(p => p.x))).toBeCloseTo(b.right, 0);
    expect(Math.min(...points.map(p => p.y))).toBeCloseTo(b.top, 0);
    expect(Math.max(...points.map(p => p.y))).toBeCloseTo(b.bottom, 0);
    expect(adventure('HIDE_SEEK', 8, b, 180, true).hide).toBeGreaterThan(.8);
    expect(adventure('HIDE_SEEK', 22, b, 180, true).hide).toBe(0);
    const small = adventure('EXPLORING', 10, b, 180, false);
    expect(Math.abs(small.x)).toBeLessThanOrEqual(180);
    expect(Math.abs(small.y)).toBeLessThanOrEqual(180);
    const m = new PetMachine(); m.request('HIDE_SEEK', 'user', 0); m.request('WAVING', 'user', 8000);
    expect(m.state).toBe('WAVING');
  });
  it('types along, settles after input stops, and honors quiet and opt-out', () => {
    const b = new Behavior(); const m = new PetMachine();
    b.update(100, m, defaults, cursor); expect(m.state).toBe('TYPING');
    b.update(3000, m, defaults, { ...cursor, typing: false }); expect(m.state).toBe('IDLE');
    for (const s of [{ ...defaults, quiet: true }, { ...defaults, workAlong: false }]) {
      const other = new PetMachine(); new Behavior().update(100, other, s, cursor); expect(other.state).toBe('IDLE');
    }
  });
  it('does not let typing interrupt a user trip or manual sleep', () => {
    for (const state of ['RUNNING', 'CLIMBING', 'SLEEPING', 'PAUSED', 'DRAGGING'] as PetState[]) {
      const m = new PetMachine(); m.request(state, 'user', 0);
      new Behavior().update(1000, m, defaults, cursor); expect(m.state).toBe(state);
    }
  });
  it('changing animation speed advances the route without rewinding time', () => {
    const m = new PetMachine(); m.request('CLIMBING', 'user', 0);
    m.tick(4000, 1); expect(m.actionSeconds).toBe(4);
    m.tick(5000, .5); expect(m.actionSeconds).toBe(4.5);
    m.tick(6000, 1.8); expect(m.actionSeconds).toBe(6.3);
  });
});
