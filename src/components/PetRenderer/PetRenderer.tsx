import { useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
// Use Pixi's static shader bindings under Tauri's CSP, which disallows eval.
import 'pixi.js/unsafe-eval';
import { createMochi } from '../../characters/mochi/artwork';
import { Pip } from '../../characters/pip/Pip';
import { Animator } from '../../engine/animation/Animator';
import { Behavior } from '../../engine/behavior/Behavior';
import { PetMachine } from '../../engine/stateMachine/PetMachine';
import { Particles } from '../../engine/particles/Particles';
import { usePetStore } from '../../stores/settings';
import { beginDrag, command, cursor, endDrag, movePet, native, onAction, publishState, reportError, saveSettings, saveStats, setRegions } from '../../services/native';
import type { Action, HitEllipse } from '../../types';
import { playChime } from '../../services/sound';

export function PetRenderer({ preview = false }: { preview?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const app = new Application(); let disposed = false; let cleanup = () => {};
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    let cachedSource = usePetStore.getState().settings;
    let cachedReduced = motionPreference.matches;
    let cachedSettings = cachedReduced ? { ...cachedSource, reducedMotion: true } : cachedSource;
    const settings = () => {
      const source = usePetStore.getState().settings;
      if (source !== cachedSource || cachedReduced !== motionPreference.matches) {
        cachedSource = source; cachedReduced = motionPreference.matches;
        cachedSettings = cachedReduced ? { ...source, reducedMotion: true } : source;
      }
      return cachedSettings;
    };
    const initialize = async () => {
      await app.init({ width: 320, height: 340, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true, preference: 'webgl' });
      if (disposed) { app.destroy(true, { children: true }); return; }
      host.current!.appendChild(app.canvas);
      const scene = new Container(); app.stage.addChild(scene);
      let outfit = usePetStore.getState().settings.outfit;
      let rig = createMochi(outfit); scene.addChild(rig.root);
      const pip = new Pip(); pip.position.set(245, 120); scene.addChild(pip);
      const particles = new Particles(); scene.addChild(particles);
      const animator = new Animator(); const behavior = new Behavior();
      let elapsed = 0, regionClock = 0, regionAt = 0, behaviorAt = 0, moveAt = 0, particleAt = 0, statsAt = 0;
      let regionBusy = false, motionBusy = false, suspended = false;
      let excursion = { x: 0, y: 0 }; let returning = false;
      const machine = new PetMachine((state, old) => {
        const s = settings();
        animator.transition(state, s.reducedMotion, s.speed); usePetStore.setState({ state }); publishState(state);
        if (['PLAYING', 'WALKING'].includes(old) && state !== 'DRAGGING') returning = true;
        if (state === 'DRAGGING') { excursion = { x: 0, y: 0 }; returning = false; }
        if (s.stats && ['WAVING', 'JUMPING', 'PLAYING', 'DRINKING_TEA'].includes(state)) {
          const stats = usePetStore.getState().stats;
          usePetStore.getState().setStats({ happiness: Math.min(100, stats.happiness + (state === 'PLAYING' ? 5 : 2)), energy: Math.max(0, Math.min(100, stats.energy + (state === 'DRINKING_TEA' ? 4 : state === 'PLAYING' ? -3 : 0))), affection: Math.min(100, stats.affection + (machine.source === 'user' ? 2 : 0)) });
        }
      });
      const request = (a: Action) => {
        if (a === 'pause') machine.request('PAUSED', 'user', elapsed);
        else if (a === 'resume') machine.resume(elapsed);
        else if (a === 'outfit') { const choices = ['lavender', 'peach', 'sky'] as const; void saveSettings({ outfit: choices[(choices.indexOf(usePetStore.getState().settings.outfit) + 1) % 3] }); }
        else {
          const state = { pet: Math.random() > .5 ? 'WAVING' : 'JUMPING', tea: 'DRINKING_TEA', play: 'PLAYING', dance: 'DANCING', sleep: 'SLEEPING', wake: 'WAKING' } as const;
          if (a === 'wake' && machine.state !== 'SLEEPING') return;
          if (machine.request(state[a], 'user', elapsed)) {
            playChime(usePetStore.getState().settings);
            const s = settings();
            if (!s.reducedMotion && !s.batterySaver && !cursor.battery && !s.quiet) for (let i = 0; i < 4; i++) particles.spawn(a === 'pet' ? 'heart' : 'sparkle', 130 + i * 20, 105 - (i % 2) * 15, s.particles);
          }
        }
      };
      const unsubscribe = onAction(request);
      // The native window starts hidden. Publish its first silhouette before visibility
      // polling can suspend the renderer; later updates follow articulated bounds.
      if (native) void setRegions([...rig.hitParts.map(p => p.getBounds()), pip.getBounds(), rig.shadow.getBounds()].map(b => ({ x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 }))).catch(reportError);
      let down: { x: number; y: number } | null = null, dragging = false;
      let clickTimer: ReturnType<typeof setTimeout> | undefined;
      const pointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || !usePetStore.getState().settings.interactions) return;
        down = { x: e.screenX, y: e.screenY }; app.canvas.setPointerCapture(e.pointerId);
      };
      const pointerMove = (e: PointerEvent) => {
        if (preview) { const rect = app.canvas.getBoundingClientRect(); Object.assign(cursor, { localX: (e.clientX - rect.left) * 320 / rect.width, localY: (e.clientY - rect.top) * 340 / rect.height, idleMs: 0 }); }
        if (!down || dragging || Math.hypot(e.screenX - down.x, e.screenY - down.y) < 5) return;
        if (!machine.request('DRAGGING', 'user', elapsed)) { down = null; return; }
        clearTimeout(clickTimer); clickTimer = undefined; dragging = true;
        void beginDrag().catch(e => { dragging = false; down = null; machine.request('IDLE', 'user', elapsed); reportError(e); });
      };
      const pointerUp = () => {
        if (!down) return;
        down = null;
        if (dragging) { dragging = false; void endDrag().catch(reportError); machine.request('IDLE', 'user', elapsed); return; }
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = undefined; machine.request('JUMPING', 'user', elapsed); }
        else clickTimer = setTimeout(() => { clickTimer = undefined; request('pet'); }, 280);
      };
      const cancel = () => { down = null; if (dragging) { dragging = false; void endDrag().catch(reportError); machine.request('IDLE', 'user', elapsed); } };
      window.addEventListener('mochi-drag-ended', cancel);
      const resetExcursion = () => { excursion = { x: 0, y: 0 }; returning = false; machine.request('IDLE', 'user', elapsed); };
      window.addEventListener('mochi-position-reset', resetExcursion);
      const context = (e: MouseEvent) => { e.preventDefault(); if (usePetStore.getState().settings.interactions) void command('menu').catch(reportError); };
      app.canvas.addEventListener('pointerdown', pointerDown); app.canvas.addEventListener('pointermove', pointerMove); app.canvas.addEventListener('pointerup', pointerUp); app.canvas.addEventListener('pointercancel', cancel); app.canvas.addEventListener('contextmenu', context);
      const statsTimer = setInterval(() => { saveStats(usePetStore.getState().stats).catch(reportError); }, 30000);
      let lastSettings = settings();
      app.ticker.add(ticker => {
        const s = settings();
        regionClock += ticker.deltaMS;
        const shouldSuspend = !cursor.visible || (s.fullscreenPause && cursor.fullscreen);
        app.ticker.maxFPS = shouldSuspend || machine.state === 'PAUSED' ? 5 : s.batterySaver || cursor.battery || s.reducedMotion ? 30 : 60;
        animator.pause(shouldSuspend || machine.state === 'PAUSED');
        if (shouldSuspend) { suspended = true; return; }
        const dt = suspended ? 0 : Math.min(ticker.deltaMS / 1000, .1); suspended = false;
        if (machine.state !== 'PAUSED') elapsed += dt * 1000;
        if (lastSettings !== s) {
          if (lastSettings.speed !== s.speed || lastSettings.reducedMotion !== s.reducedMotion) animator.transition(machine.state, s.reducedMotion, s.speed);
          if ((s.quiet || s.reducedMotion || !s.followCursor) && (excursion.x || excursion.y)) returning = true;
          lastSettings = s;
        }
        if (s.outfit !== outfit) { outfit = s.outfit; scene.removeChild(rig.root); rig.root.destroy({ children: true }); rig = createMochi(outfit); scene.addChildAt(rig.root, 0); }
        scene.alpha = s.opacity;
        pip.visible = s.pip;
        const effects = s.particles > 0 && !s.reducedMotion && !s.batterySaver && !cursor.battery && !s.quiet;
        if (!effects) particles.update(0, false);
        if (machine.state !== 'PAUSED') {
          machine.tick(elapsed, s.speed);
          animator.update(rig, elapsed / 1000, dt, cursor, s);
          if (elapsed > behaviorAt) { behaviorAt = elapsed + 250; behavior.update(elapsed, machine, s, cursor); }
          if (s.reducedMotion) { pip.position.set(machine.state === 'SLEEPING' ? 220 : 243, machine.state === 'SLEEPING' ? 299 : 115); pip.rotation = 0; }
          else pip.update(elapsed / 1000, machine.state === 'SLEEPING', machine.state === 'PLAYING', cursor.localX, cursor.localY, animator.pose.jump);
          particles.update(dt, effects);
          if (effects && elapsed > particleAt && ticker.FPS > 24) { particleAt = elapsed + 1800; particles.spawn(machine.state === 'SLEEPING' ? 'sleep' : machine.state === 'PLAYING' ? 'butterfly' : machine.state === 'DRINKING_TEA' ? 'bubble' : machine.state === 'DANCING' ? 'star' : 'dust', 207, 105, s.particles); }
          if (elapsed > statsAt) { statsAt = elapsed + 10000; if (s.stats && machine.state === 'SLEEPING') { const stats = usePetStore.getState().stats; usePetStore.getState().setStats({ ...stats, energy: Math.min(100, stats.energy + 1) }); } }
          if (elapsed > moveAt && !motionBusy && !dragging && (returning || (!s.quiet && !s.reducedMotion))) {
            moveAt = elapsed + 80;
            let dx = 0, dy = 0;
            let finishReturn = false;
            if (returning) {
              dx = -excursion.x * .15; dy = -excursion.y * .15;
              if (s.reducedMotion || s.quiet || Math.hypot(excursion.x, excursion.y) < 1) { dx = -excursion.x; dy = -excursion.y; returning = false; finishReturn = true; }
            }
            else if (machine.state === 'WALKING') dx = Math.sin((elapsed - machine.since) / 1600) * 1.8;
            else if (machine.state === 'PLAYING' && s.followCursor) { dx = Math.max(-5, Math.min(5, (cursor.localX - 160) * .025)); dy = Math.max(-3, Math.min(3, (cursor.localY - 180) * .015)); }
            if (!returning && !finishReturn) { dx = Math.max(-s.playRadius - excursion.x, Math.min(s.playRadius - excursion.x, dx)); dy = Math.max(-s.playRadius - excursion.y, Math.min(s.playRadius - excursion.y, dy)); }
            if (Math.abs(dx) > .1) animator.facing = Math.sign(dx);
            if (dx || dy || finishReturn) { excursion.x += dx; excursion.y += dy; motionBusy = true; void movePet(excursion.x, excursion.y, finishReturn).catch(reportError).finally(() => { motionBusy = false; }); }
          }
        }
        if (native && regionClock >= regionAt && !regionBusy) {
          regionAt = regionClock + 100; regionBusy = true;
          const bounds = [...rig.hitParts.map(part => part.getBounds()), ...(rig.cup.visible ? [rig.cup.getBounds()] : []), ...(pip.visible ? [pip.getBounds()] : []), ...particles.regions(), rig.shadow.getBounds()];
          // Elliptical visual envelopes also define the real Windows input region.
          const regions: HitEllipse[] = bounds.map(b => ({ x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 }));
          void setRegions(regions).catch(reportError).finally(() => { regionBusy = false; });
        }
        if (import.meta.env.DEV && host.current) host.current.dataset.fps = String(Math.round(ticker.FPS));
      });
      cleanup = () => { unsubscribe(); clearTimeout(clickTimer); clearInterval(statsTimer); window.removeEventListener('mochi-drag-ended', cancel); window.removeEventListener('mochi-position-reset', resetExcursion); cancel(); animator.destroy(); app.destroy(true, { children: true }); };
    };
    initialize().catch(reportError);
    return () => { disposed = true; cleanup(); };
  }, [preview]);
  return <div className="pet-canvas" ref={host} aria-label="Mochi, your animated desktop companion" role="img" />;
}

