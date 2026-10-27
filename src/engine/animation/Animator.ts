import gsap from 'gsap';
import type { MochiRig } from '../../characters/mochi/artwork';
import type { CursorSample, PetState, Settings } from '../../types';
export class Animator {
  private timeline: gsap.core.Timeline | null = null;
  pose = { jump: 0, squash: 1, wave: 0, sleep: 0, tilt: 0, cup: 0 };
  private blinkAt = 3;
  private blinkUntil = 0;
  state: PetState = 'IDLE';
  facing = 1;
  transition(state: PetState, reduced: boolean, speed: number) {
    this.timeline?.kill(); this.state = state;
    const p = this.pose;
    p.wave = 0; p.jump = 0; p.squash = 1; p.cup = 0;
    const t = gsap.timeline({ defaults: { ease: 'sine.inOut' } }).timeScale(speed); this.timeline = t;
    if (state === 'PAUSED') { t.pause(); return; }
    t.to(p, { sleep: state === 'SLEEPING' ? 1 : 0, duration: reduced ? .1 : state === 'WAKING' ? 2 : .8 }, 0);
    if (reduced) return;
    if (state === 'JUMPING') t.to(p, { squash: .87, duration: .2 }, 0).to(p, { jump: -48, squash: 1.07, duration: .35 }).to(p, { jump: 0, squash: .9, duration: .35 }).to(p, { squash: 1, duration: .25 });
    if (state === 'WAVING') t.to(p, { wave: -2.4, duration: .45 }, 0).to(p, { wave: -1.7, duration: .22, repeat: 5, yoyo: true }).to(p, { wave: 0, duration: .4 });
    if (state === 'DRINKING_TEA') t.to(p, { cup: 1, duration: 1 }, .3).to(p, { cup: 0, duration: .8 }, 5.4);
    if (state === 'WAKING') t.to(p, { wave: -1.5, duration: .8 }, 0).to(p, { wave: 0, duration: .8 }, 1.5);
  }
  pause(paused: boolean) { if (paused) this.timeline?.pause(); else this.timeline?.resume(); }
  update(r: MochiRig, time: number, dt: number, c: CursorSample, s: Settings) {
    const p = this.pose; const reduced = s.reducedMotion; const sleeping = this.state === 'SLEEPING';
    const t = time * s.speed;
    if (t > this.blinkAt) { this.blinkUntil = t + .14; this.blinkAt = t + 3 + Math.random() * 4; }
    const blink = t < this.blinkUntil;
    const movement = reduced || s.quiet ? .25 : 1;
    const calm = c.idleMs >= s.calmAfter * 1000 ? .4 : 1;
    const breath = Math.sin(t * (sleeping ? 1.3 : 2)) * .012 * movement;
    const sitting = this.state === 'SITTING' ? 12 : 0;
    r.rig.y = 280 + p.jump + p.sleep * 13 + sitting;
    r.rig.scale.set(1 + (1 - p.squash) * .35 + p.sleep * .05, p.squash - p.sleep * .08 + breath);
    const walk = this.state === 'WALKING' || this.state === 'PLAYING';
    const facing = walk ? this.facing : 1;
    r.rig.scale.x *= facing;
    r.leftLeg.rotation = walk ? Math.sin(t * 9) * .36 * movement : Math.sin(t * 2) * .09 * (sitting ? 1 : 0);
    r.rightLeg.rotation = -r.leftLeg.rotation;
    if (walk) r.rig.y -= Math.abs(Math.sin(t * 9)) * 3 * movement;
    r.rig.rotation = this.state === 'DANCING' ? Math.sin(t * 6) * .13 * movement : this.state === 'DRAGGING' ? Math.sin(t * 5) * .08 * movement : 0;
    r.leftArm.rotation = .15 + (walk ? Math.sin(t * 9) * .25 * movement : -p.wave * .25);
    r.rightArm.rotation = -.15 + p.wave;
    if (this.state === 'DANCING') { r.leftArm.rotation = 1 + Math.sin(t * 6) * .6 * movement; r.rightArm.rotation = -r.leftArm.rotation; }
    const dx = Math.max(-1, Math.min(1, (c.localX - 160) / 150)) * facing;
    const dy = Math.max(-1, Math.min(1, (c.localY - 165) / 130));
    const gaze = !sleeping && s.followCursor;
    const ease = 1 - Math.exp(-dt * 7);
    const target = gaze ? dx * .065 * movement * calm : p.sleep * .09;
    r.head.rotation += (target - r.head.rotation) * ease;
    r.hair.rotation = Math.sin(t * 1.8) * .013 * movement;
    r.eyes.scale.y = Math.max(.02, (1 - p.sleep) * (blink ? .06 : 1));
    r.eyes.visible = p.sleep < .9; r.lids.visible = p.sleep >= .9;
    r.pupils.forEach((eye, i) => { eye.x += ((i ? 25 : -25) + (gaze ? dx * 3.2 : 0) - eye.x) * ease; eye.y += ((gaze ? dy * 2.5 : 0) - eye.y) * ease; });
    r.yawn.visible = this.state === 'WAKING' || (c.velocity > 1600 && this.state === 'CURIOUS');
    r.mouth.visible = !r.yawn.visible;
    r.cup.visible = this.state === 'DRINKING_TEA'; r.cup.y = -40 - p.cup * 38; r.cup.x = 14 - p.cup * 10;
    r.steam.alpha = .5 + Math.sin(t * 2) * .25;
    r.shadow.scale.x = 1 + p.jump / 160;
  }
  destroy() { this.timeline?.kill(); }
}
