import { Container, Graphics } from 'pixi.js';
export class Pip extends Container {
  constructor() { super(); this.addChild(new Graphics().ellipse(-12, 0, 12, 5).ellipse(12, 0, 12, 5).fill({ color: 0xfff4cb, alpha: .65 }).circle(0, 0, 13).fill(0xffe6a6).stroke({ color: 0xd6b976, width: 1.4 }).circle(-4, -1, 1.7).circle(4, -1, 1.7).fill(0x635268).ellipse(0, 5, 2, 1).fill(0xdca68c)); }
  update(t: number, dt: number, sleep: boolean, playing: boolean, working: boolean, jump: number) {
    const tx = playing ? 160 + Math.sin(t * 1.8) * 105 : sleep ? 220 : working ? 246 : 243 + Math.sin(t * .7) * 18;
    const ty = playing ? 160 + Math.sin(t * 3.6) * 48 : sleep ? 299 : working ? 252 + Math.sin(t * 1.6) * 4 : 115 + Math.cos(t * 1.2) * 14 + jump * .2;
    const ease = 1 - Math.exp(-dt * (playing ? 6 : 3));
    this.x += (tx - this.x) * ease; this.y += (ty - this.y) * ease;
    this.rotation = Math.sin(t * 2) * .07; this.alpha = sleep ? .6 : .95;
  }
}
