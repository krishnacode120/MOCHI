import { PetMachine } from '../stateMachine/PetMachine';
import type { CursorSample, PetState, Settings } from '../../types';
export class Behavior {
  private nextAction = 18000;
  private last: PetState = 'IDLE';
  constructor(private random = Math.random) {}
  update(now: number, m: PetMachine, s: Settings, cursor: CursorSample) {
    if (m.state === 'PAUSED' || m.state === 'DRAGGING') return;
    if (m.state === 'SLEEPING') {
      if (!m.manualSleep && cursor.idleMs < 2000) m.request('WAKING', 'system', now);
      return;
    }
    if (s.autoSleep && cursor.idleMs >= s.sleepAfter * 1000) { m.request('SLEEPING', 'system', now); return; }
    if (s.autoSleep && cursor.idleMs >= s.sitAfter * 1000) { if (m.resting) m.request('SITTING', 'system', now); return; }
    if (m.state === 'SITTING' && m.source === 'system' && cursor.idleMs < 2000) m.request('IDLE', 'system', now);
    const near = Math.hypot(cursor.localX - 160, cursor.localY - 160) < 170 * s.sensitivity;
    if (s.interactions && !s.quiet && near && m.state === 'IDLE') m.request('CURIOUS', 'idle', now);
    if (!near && m.state === 'CURIOUS') m.request('IDLE', 'idle', now);
    if (now < this.nextAction || !m.resting) return;
    this.nextAction = now + 22000 + this.random() * 26000;
    if (!s.randomActions || s.quiet || cursor.idleMs > s.calmAfter * 1000) return;
    const choices: PetState[] = ['SITTING', 'WAVING', 'DRINKING_TEA', 'WALKING', 'JUMPING'];
    const options = choices.filter(x => x !== this.last);
    const next = options[Math.floor(this.random() * options.length)];
    if (m.request(next, 'idle', now)) this.last = next;
  }
}
