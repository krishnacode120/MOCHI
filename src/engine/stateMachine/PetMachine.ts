import type { PetState } from '../../types';
import { tripSeconds } from '../physics/adventures';
export type Source = 'idle' | 'system' | 'user';
const resting = new Set<PetState>(['IDLE', 'CURIOUS', 'SITTING']);
export const durations: Partial<Record<PetState, number>> = { WRITING: 18000, HUGGING: 5000, STORYTELLING: 9000, WONDERING: 7000, REASSEMBLING: 6500, SUNBATHING: 8000, COLLECTING: 8500, WAVING: 2600, JUMPING: 1500, DANCING: 5400, DRINKING_TEA: 6500, WAKING: 2800, TYPING: 12000, WATCHING: 7000, STRETCHING: 5000, SITTING: 12000 };
export class PetMachine {
  state: PetState = 'IDLE';
  since = 0;
  source: Source = 'idle';
  manualSleep = false;
  private previous: PetState = 'IDLE';
  private last = new Map<PetState, number>();
  private pending: PetState | null = null;
  private age = 0;
  private tickAt = 0;
  constructor(private changed: (state: PetState, previous: PetState) => void = () => {}) {}
  request(next: PetState, source: Source, now: number): boolean {
    if (next === this.state) return false;
    if (this.state === 'PAUSED' && next !== 'IDLE') return false;
    if (next === 'PAUSED') this.previous = this.state === 'SLEEPING' ? 'SLEEPING' : 'IDLE';
    if (this.state === 'DRAGGING' && !['IDLE', 'PAUSED'].includes(next)) return false;
    if (this.state === 'SLEEPING' && !['WAKING', 'DRAGGING', 'PAUSED'].includes(next)) {
      if (source !== 'user') return false;
      this.pending = next;
      return this.request('WAKING', 'user', now);
    }
    if (source === 'idle' && (!resting.has(this.state) || now - (this.last.get(next) ?? -Infinity) < 16000)) return false;
    if (source === 'system' && this.source === 'user' && !resting.has(this.state) && next !== 'WAKING') return false;
    if (this.state === 'WAKING' && next !== 'DRAGGING' && next !== 'PAUSED') {
      if (source === 'user') this.pending = next;
      return false;
    }
    if (next === 'DRAGGING' || next === 'PAUSED') this.pending = null;
    if (next === 'SLEEPING') this.manualSleep = source === 'user';
    if (next === 'WAKING' || next === 'DRAGGING') this.manualSleep = false;
    this.enter(next, source, now); return true;
  }
  private enter(next: PetState, source: Source, now: number) {
    const old = this.state; this.state = next; this.since = now; this.source = source; this.age = 0; this.tickAt = now;
    this.last.set(next, now); this.changed(next, old);
  }
  resume(now: number) { if (this.state === 'PAUSED') this.enter(this.previous, 'system', now); }
  tick(now: number, speed = 1) {
    this.age += Math.max(0, now - this.tickAt) * speed; this.tickAt = now;
    const duration = tripSeconds[this.state] ? tripSeconds[this.state]! * 1000 : durations[this.state];
    if (duration && this.age >= duration) {
      const next = this.pending ?? 'IDLE'; this.pending = null;
      this.enter(next, next === 'IDLE' ? 'idle' : 'user', now);
    }
  }
  get resting() { return resting.has(this.state); }
  get actionSeconds() { return this.age / 1000; }
}
