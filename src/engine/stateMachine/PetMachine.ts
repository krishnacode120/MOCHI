import type { PetState } from '../../types';
export type Source = 'idle' | 'system' | 'user';
const resting = new Set<PetState>(['IDLE', 'CURIOUS', 'SITTING']);
const durations: Partial<Record<PetState, number>> = { WAVING: 2600, JUMPING: 1500, DANCING: 5400, DRINKING_TEA: 6500, WAKING: 2800, WALKING: 5500, PLAYING: 10000 };
export class PetMachine {
  state: PetState = 'IDLE';
  since = 0;
  source: Source = 'idle';
  manualSleep = false;
  private previous: PetState = 'IDLE';
  private last = new Map<PetState, number>();
  private pending: PetState | null = null;
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
    const old = this.state; this.state = next; this.since = now; this.source = source;
    this.last.set(next, now); this.changed(next, old);
  }
  resume(now: number) { if (this.state === 'PAUSED') this.enter(this.previous, 'system', now); }
  tick(now: number, speed = 1) {
    const duration = durations[this.state];
    if (duration && (now - this.since) * speed >= duration) {
      const next = this.pending ?? 'IDLE'; this.pending = null;
      this.enter(next, next === 'IDLE' ? 'idle' : 'user', now);
    }
  }
  get resting() { return resting.has(this.state); }
}
