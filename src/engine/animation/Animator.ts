import gsap from 'gsap';
import type { MochiRig } from '../../characters/mochi/artwork';
import type { CursorSample, PetState, Settings } from '../../types';

export class Animator {
  private timeline: gsap.core.Timeline | null = null;
  pose = { jump: 0, squash: 1, wave: 0, sleep: 0, cup: 0, desk: 0 };
  private clock = 0;
  private blinkAt = 3;
  private blinkUntil = 0;
  private turn = 1;
  private grip = 0;
  private stride = 0;
  private hiding = 0;
  private floating = 0;
  private wallSide = 1;
  state: PetState = 'IDLE';
  facing = 1;
  motion = { speed: 0, grip: 0, side: 1, hide: 0, float: 0, hop: 0 };
  transition(state: PetState, reduced: boolean, speed: number) {
    this.timeline?.kill(); this.state = state;
    if (state === 'PAUSED') return;
    const p = this.pose;
    const t = gsap.timeline({ defaults: { ease: 'sine.inOut' } }).timeScale(speed); this.timeline = t;
    // Blend out of the current pose instead of resetting articulated parts.
    t.to(p, { jump: 0, squash: 1, wave: 0, cup: 0, desk: state === 'TYPING' ? 1 : 0, duration: reduced ? .15 : .35 }, 0);
    t.to(p, { sleep: state === 'SLEEPING' ? 1 : 0, duration: reduced ? .15 : state === 'WAKING' ? 2 : .8 }, 0);
    if (reduced) return;
    if (['RUNNING', 'EXPLORING', 'HOPSCOTCH', 'HIDE_SEEK'].includes(state)) t.to(p, { squash: .94, duration: .16 }, .2).to(p, { squash: 1, duration: .3 });
    if (state === 'JUMPING') t.to(p, { squash: .9, duration: .18 }, .35).to(p, { jump: -34, squash: 1.04, duration: .28 }).to(p, { jump: 0, squash: .94, duration: .3 }).to(p, { squash: 1, duration: .25 });
    if (state === 'WAVING') t.to(p, { wave: -2.25, duration: .4 }, .35).to(p, { wave: -1.8, duration: .2, repeat: 5, yoyo: true }).to(p, { wave: 0, duration: .4 });
    if (state === 'DRINKING_TEA') t.to(p, { cup: 1, duration: .8 }, .4).to(p, { cup: 0, duration: .8 }, 5.4);
    if (state === 'WAKING') t.to(p, { wave: -1.5, duration: .8 }, .35).to(p, { wave: 0, duration: .8 }, 1.8);
  }
  pause(paused: boolean) { if (paused) this.timeline?.pause(); else this.timeline?.resume(); }
  update(r: MochiRig, _time: number, dt: number, c: CursorSample, s: Settings) {
    this.clock += dt * s.speed;
    const t = this.clock, p = this.pose;
    const sleeping = this.state === 'SLEEPING';
    const gentle = s.reducedMotion || s.quiet;
    const amount = gentle ? .12 : 1;
    const blend = 1 - Math.exp(-dt * 12);
    const lerp = (a: number, b: number) => a + (b - a) * blend;
    if (t > this.blinkAt) { this.blinkUntil = t + .13; this.blinkAt = t + 3 + Math.random() * 4; }
    const walking = ['WALKING', 'RUNNING', 'PLAYING', 'CLIMBING', 'HIDE_SEEK', 'HOPSCOTCH'].includes(this.state);
    const strideTarget = walking || Math.abs(this.motion.speed) > 3 ? Math.min(1, Math.abs(this.motion.speed) / 65) : 0;
    this.stride = lerp(this.stride, gentle ? 0 : strideTarget);
    this.grip = lerp(this.grip, gentle ? 0 : this.motion.grip);
    this.hiding = lerp(this.hiding, gentle ? 0 : this.motion.hide);
    this.floating = lerp(this.floating, gentle ? 0 : this.motion.float);
    if (this.motion.grip > 0 || this.motion.hide > 0) this.wallSide = this.motion.side;
    const run = this.state === 'RUNNING' || this.state === 'PLAYING';
    const cycle = Math.sin(t * (run ? 13 : 8));
    if (Math.abs(this.motion.speed) > 4) this.facing = Math.sign(this.motion.speed);
    const facing = this.grip > .1 || this.hiding > .1 || this.floating > .1 ? 1 : walking || this.stride > .1 ? this.facing : 1;
    this.turn = lerp(this.turn, facing);
    const sit = this.state === 'SITTING' || this.state === 'TYPING' ? 10 : 0;
    const stretch = this.state === 'STRETCHING' ? Math.sin(Math.PI * Math.min(1, this.actionTime / 5)) : 0;
    r.rig.x = lerp(r.rig.x, 160 + this.wallSide * (this.grip * 70 + this.hiding * 182));
    const bounce = Math.abs(cycle) * (run ? 4 : 2) * this.stride * (1 - this.grip);
    r.rig.y = lerp(r.rig.y, 280 + p.jump + p.sleep * 13 + sit - bounce - stretch * 6 * amount - this.floating * (7 + Math.sin(t * 1.8) * 3));
    r.rig.scale.set((1 + (1 - p.squash) * .3 + p.sleep * .05) * this.turn, p.squash - p.sleep * .08 + Math.sin(t * (sleeping ? 1.3 : 2)) * .008 * amount);
    const lean = this.state === 'DANCING' ? Math.sin(t * 5) * .08 * amount : this.state === 'DRAGGING' ? Math.sin(t * 4) * .045 * amount : run ? -.035 * this.stride : 0;
    r.rig.rotation = lerp(r.rig.rotation, lean + Math.sin(t * 1.4) * .035 * this.floating - this.hiding * this.wallSide * .06);
    r.leftLeg.rotation = lerp(r.leftLeg.rotation, cycle * .48 * this.stride * (1 - this.floating) + Math.sin(t * 5) * .25 * this.grip + Math.sin(t * 2) * .12 * this.floating + this.motion.hop * .35);
    r.rightLeg.rotation = lerp(r.rightLeg.rotation, -r.leftLeg.rotation);
    let left = .15 + cycle * .35 * this.stride - p.wave * .25;
    let right = -.15 - cycle * .35 * this.stride + p.wave;
    if (this.state === 'DANCING') { left = .8 + Math.sin(t * 5) * .4 * amount; right = -left; }
    left = left * (1 - p.desk) + (-.65 + Math.sin(t * 16) * .12 * amount) * p.desk;
    right = right * (1 - p.desk) + (.65 - Math.sin(t * 16) * .12 * amount) * p.desk;
    left += stretch * 2.4 * amount; right -= stretch * 2.4 * amount;
    left = left * (1 - this.grip) + (-this.wallSide * 1.8 + Math.sin(t * 5) * .3) * this.grip;
    right = right * (1 - this.grip) + (-this.wallSide * 1.8 - Math.sin(t * 5) * .3) * this.grip;
    left = left * (1 - this.floating) - 2.8 * this.floating;
    right += Math.sin(t * 1.8) * .15 * this.floating;
    left += this.hiding * 1.8; right -= this.hiding * 1.8;
    r.leftArm.rotation = lerp(r.leftArm.rotation, left); r.rightArm.rotation = lerp(r.rightArm.rotation, right);
    const gaze = !sleeping && s.followCursor && p.desk < .5;
    const dx = Math.max(-1, Math.min(1, (c.localX - 160) / 180)) * facing;
    const dy = Math.max(-1, Math.min(1, (c.localY - 165) / 150));
    const watching = this.state === 'WATCHING' ? Math.sin(t * .9) * .035 * amount : 0;
    r.head.rotation = lerp(r.head.rotation, (gaze ? dx * .055 : p.sleep * .09) + watching);
    const hairEase = 1 - Math.exp(-dt * 4);
    r.hair.rotation += (Math.sin(t * 1.8) * .009 * amount - r.rig.rotation * .3 - r.hair.rotation) * hairEase;
    r.balloons.visible = this.floating > .01; r.balloons.alpha = this.floating;
    r.balloons.rotation = Math.sin(t * 1.2 - .6) * .022 * this.floating;
    r.eyes.scale.y = Math.max(.02, (1 - p.sleep) * (t < this.blinkUntil ? .06 : 1));
    r.eyes.visible = p.sleep < .9; r.lids.visible = p.sleep >= .9;
    r.pupils.forEach((eye, i) => { eye.x = lerp(eye.x, (i ? 25 : -25) + (gaze ? dx * 3.2 : 0)); eye.y = lerp(eye.y, p.desk * 3 + (gaze ? dy * 2.5 : 0)); });
    r.yawn.visible = this.state === 'WAKING'; r.mouth.visible = !r.yawn.visible;
    r.cup.visible = p.cup > .01; r.cup.alpha = p.cup; r.cup.y = -40 - p.cup * 38; r.cup.x = 14 - p.cup * 10;
    r.steam.alpha = .5 + Math.sin(t * 2) * .2;
    r.laptop.visible = p.desk > .01; r.laptop.alpha = p.desk; r.laptop.y = -8 + (1 - p.desk) * 12;
    // Decorative strokes only: never display or echo actual keyboard text.
    r.codeLines.children.forEach((line, i) => { line.scale.x = gentle ? 1 : .55 + .45 * ((Math.floor(t * 3) + i * 2) % 5) / 4; });
    r.shadow.scale.x = 1 + p.jump / 160; r.shadow.alpha = .12 * (1 - Math.max(this.grip, this.floating, this.hiding));
  }
  actionTime = 0;
  destroy() { this.timeline?.kill(); }
}
