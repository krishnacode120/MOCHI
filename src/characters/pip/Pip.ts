import { Container, Graphics } from 'pixi.js';
export class Pip extends Container {
  constructor() { super(); this.addChild(new Graphics().ellipse(-12, 0, 12, 5).ellipse(12, 0, 12, 5).fill({ color: 0xfff4cb, alpha: .65 }).circle(0, 0, 13).fill(0xffe6a6).stroke({ color: 0xd6b976, width: 1.4 }).circle(-4, -1, 1.7).circle(4, -1, 1.7).fill(0x635268).ellipse(0, 5, 2, 1).fill(0xdca68c)); }
  update(t: number, sleep: boolean, playing: boolean, x: number, y: number, jump: number) {
    const tx = playing ? Math.max(35, Math.min(285, x)) : sleep ? 220 : 243 + Math.sin(t * .7) * 24;
    const ty = playing ? Math.max(45, Math.min(290, y)) : sleep ? 299 : 115 + Math.cos(t * 1.2) * 20 + jump * .2;
    this.x += (tx - this.x) * .06; this.y += (ty - this.y) * .06;
    this.rotation = Math.sin(t * 2) * .07; this.alpha = sleep ? .6 : .95;
  }
}
