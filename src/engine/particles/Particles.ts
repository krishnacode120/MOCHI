import { Container, Graphics } from 'pixi.js';
export type Effect = 'heart' | 'sparkle' | 'star' | 'bubble' | 'sleep' | 'butterfly' | 'dust';
interface Particle { view: Graphics; life: number; ttl: number; vx: number; vy: number }
export class Particles extends Container {
  private pool: Particle[] = Array.from({ length: 32 }, () => { const view = new Graphics(); view.visible = false; this.addChild(view); return { view, life: 0, ttl: 1, vx: 0, vy: 0 }; });
  spawn(effect: Effect, x: number, y: number, limit: number) {
    if (this.pool.filter(p => p.life > 0).length >= limit) return;
    const p = this.pool.find(p => p.life <= 0); if (!p) return;
    const g = p.view; g.clear();
    if (effect === 'heart') g.moveTo(0, 6).bezierCurveTo(-15, -3, -5, -12, 0, -5).bezierCurveTo(5, -12, 15, -3, 0, 6).fill(0xe7a3b6);
    else if (effect === 'sleep') g.moveTo(-4, -4).lineTo(4, -4).lineTo(-4, 4).lineTo(4, 4).stroke({ color: 0xb9a5d5, width: 2 });
    else if (effect === 'bubble') g.circle(0, 0, 5).stroke({ color: 0xbbdce7, width: 1.5 });
    else if (effect === 'butterfly') g.ellipse(-4, 0, 5, 7).ellipse(4, 0, 5, 7).fill(0xf0d395);
    else if (effect === 'dust') g.circle(0, 0, 2).fill(0xeecba2);
    else g.star(0, 0, effect === 'star' ? 5 : 4, 7, 2.5).fill(0xe9ce94);
    g.position.set(x, y); g.visible = true; g.rotation = 0; p.life = p.ttl = 1.8 + Math.random() * .8; p.vx = (Math.random() - .5) * 20; p.vy = -15 - Math.random() * 10;
  }
  update(dt: number, enabled: boolean) { for (const p of this.pool) { if (!enabled) p.life = 0; if (p.life <= 0) { p.view.visible = false; continue; } p.life -= dt; p.view.x += p.vx * dt; p.view.y += p.vy * dt; p.view.alpha = Math.max(0, Math.min(1, p.life / .7)); p.view.scale.set(.6 + .4 * Math.sin(Math.PI * Math.max(0, p.life) / p.ttl)); } }
  regions() { return this.pool.filter(p => p.life > 0).map(p => p.view.getBounds()); }
}
