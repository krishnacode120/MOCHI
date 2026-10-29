import { supportsState } from '../../characters/profiles';
import { useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
// Use Pixi's static shader bindings under Tauri's CSP, which disallows eval.
import 'pixi.js/unsafe-eval';
import { createCharacter } from '../../characters/createCharacter';
import { Climate } from '../../engine/particles/Climate';
import { Pip } from '../../characters/pip/Pip';
import { Animator } from '../../engine/animation/Animator';
import { shouldSuspend as suspendScene } from '../../engine/behavior/sceneRules';
import { Behavior } from '../../engine/behavior/Behavior';
import { PetMachine } from '../../engine/stateMachine/PetMachine';
import { Particles } from '../../engine/particles/Particles';
import { usePetStore } from '../../stores/settings';
import { beginDrag, command, cursor, endDrag, movePet, movementBounds, native, onAction, publishState, reportError, saveSettings, saveStats, setRegions } from '../../services/native';
import { adventure, traveling } from '../../engine/physics/adventures';
import type { Action, HitEllipse, MovementBounds } from '../../types';
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
      let character = settings().character;
      const climate = new Climate(); scene.addChild(climate);
      let rig = createCharacter(settings()); scene.addChild(rig.root);
      const pip = new Pip(); pip.position.set(245, 120); scene.addChild(pip);
      const particles = new Particles(); scene.addChild(particles);
      const animator = new Animator(); const behavior = new Behavior();
      let elapsed = 0, regionClock = 0, regionAt = 0, behaviorAt = 0, moveAt = 0, particleAt = 0, statsAt = 0;
      let regionBusy = false, motionBusy = false, suspended = false;
      let excursion = { x: 0, y: 0 }; let returning = false;
      let bounds: MovementBounds | null = null, tripId = 0, wallTrip = false;
      let sent = { x: 0, y: 0 }, routeVariant = 0;
      const machine = new PetMachine((state, old) => {
        const s = settings();
        animator.transition(state, s.reducedMotion, s.speed); usePetStore.setState({ state }); publishState(state);
        const id = ++tripId;
        if (traveling(old) && state !== 'DRAGGING') returning = true;
        if (traveling(state)) {
          bounds = null; returning = false; routeVariant = Math.random(); wallTrip ||= s.fullScreenRoam || state === 'CEILING_CRAWLING' || state === 'CLIMBING' || state === 'HIDE_SEEK';
          void movementBounds().then(value => { if (!disposed && id === tripId) bounds = value; }).catch(e => { reportError(e); if (id === tripId) machine.request('IDLE', 'user', elapsed); });
        }
        if (state === 'DRAGGING') { excursion = { x: 0, y: 0 }; returning = false; wallTrip = false; bounds = null; sent = { x: 0, y: 0 }; }
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
          const state = { ceiling: 'CEILING_CRAWLING', patrol: 'TREASURE_PATROL', rocket: 'GUM_ROCKET', compact: 'COMPACTING', inspect: 'INSPECTING', recharge: 'RECHARGING', web: 'WEB_SHOOTING', swing: 'WEB_SWINGING', sense: 'SPIDER_SENSE', meat: 'EATING_MEAT', punch: 'GUM_PUNCH', hat: 'HAT_TIP', pet: machine.state === 'HIDE_SEEK' || Math.random() > .5 ? 'WAVING' : 'JUMPING', tea: 'DRINKING_TEA', play: 'PLAYING', run: 'RUNNING', climb: 'CLIMBING', explore: 'EXPLORING', hideSeek: 'HIDE_SEEK', hop: 'HOPSCOTCH', movie: machine.state === 'MOVIE' ? 'IDLE' : 'MOVIE', write: 'WRITING', teleport: 'TELEPORTING', fall: 'FALLING', hug: 'HUGGING', story: 'STORYTELLING', wonder: 'WONDERING', shuffle: 'REASSEMBLING', summer: 'SUNBATHING', collect: 'COLLECTING', work: 'TYPING', watch: 'WATCHING', stretch: 'STRETCHING', dance: 'DANCING', sleep: 'SLEEPING', wake: 'WAKING' } as const;
          if (!supportsState(settings().character, state[a])) return;
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
      if (native) void setRegions([...rig.hitParts.map(p => p.getBounds()), pip.getBounds(), rig.shadow.getBounds()].filter(b => b.width > 0 && b.height > 0).map(b => ({ x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 }))).catch(reportError);
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
      const resetExcursion = () => { machine.request('IDLE', 'user', elapsed); tripId++; excursion = { x: 0, y: 0 }; sent = { x: 0, y: 0 }; returning = false; wallTrip = false; bounds = null; };
      window.addEventListener('mochi-position-reset', resetExcursion);
      const context = (e: MouseEvent) => { e.preventDefault(); if (usePetStore.getState().settings.interactions) void command('menu').catch(reportError); };
      app.canvas.addEventListener('pointerdown', pointerDown); app.canvas.addEventListener('pointermove', pointerMove); app.canvas.addEventListener('pointerup', pointerUp); app.canvas.addEventListener('pointercancel', cancel); app.canvas.addEventListener('contextmenu', context);
      const statsTimer = setInterval(() => { saveStats(usePetStore.getState().stats).catch(reportError); }, 30000);
      let previewTypedAt = -Infinity;
      const previewKey = () => { previewTypedAt = performance.now(); };
      if (preview) window.addEventListener('keydown', previewKey);
      let lastSettings = settings();
      app.ticker.add(ticker => {
        const s = settings();
        regionClock += ticker.deltaMS;
        const shouldSuspend = suspendScene(cursor.visible, cursor.fullscreen, s.fullscreenPause, machine.state);
        app.ticker.maxFPS = shouldSuspend || machine.state === 'PAUSED' ? 5 : s.batterySaver || cursor.battery || s.reducedMotion ? 30 : 60;
        if (shouldSuspend) { suspended = true; return; }
        const dt = suspended ? 0 : Math.min(ticker.deltaMS / 1000, .1); suspended = false;
        if (machine.state !== 'PAUSED') elapsed += dt * 1000;
        if (lastSettings !== s) {
          // Pose and route now share the same action clock; speed changes never restart either.
          if ((s.quiet || s.reducedMotion || !s.adventures || lastSettings.fullScreenRoam !== s.fullScreenRoam) && traveling(machine.state)) machine.request('IDLE', 'user', elapsed);
          lastSettings = s;
        }
        if (s.outfit !== outfit || s.character !== character) { if (s.character !== character) machine.resetCharacter(elapsed); outfit = s.outfit; character = s.character; scene.removeChild(rig.root); rig.root.destroy({ children: true }); rig = createCharacter(s); scene.addChildAt(rig.root, 1); }
        scene.alpha = s.opacity;
        pip.visible = s.pip;
        const effects = s.particles > 0 && !s.reducedMotion && !s.batterySaver && !cursor.battery && !s.quiet;
        if (!effects) particles.update(0, false);
        if (machine.state !== 'PAUSED') {
          machine.tick(elapsed, s.speed);
          if (preview) cursor.typing = s.workAlong && performance.now() - previewTypedAt < 1200;
          if (elapsed > behaviorAt) { behaviorAt = elapsed + 250; behavior.update(elapsed, machine, s, cursor); }
          const previousX = excursion.x;
          let ceiling = 0, grip = 0, side = 1, hide = 0, float = 0, hop = 0, vanish = 0;
          if (!dragging && (returning || (traveling(machine.state) && bounds && !s.quiet && !s.reducedMotion))) {
            const target = returning ? { x: 0, y: 0, ceiling: 0, grip: 0, side: 1, hide: 0, float: 0, hop: 0, vanish: 0, warp: false } : adventure(machine.state, machine.actionSeconds, bounds!, s.playRadius, s.fullScreenRoam, routeVariant);
            const ease = target.warp ? 1 : Math.min(1 - Math.exp(-dt * (returning ? 4 : 12)), returning ? 320 * dt / Math.max(1, Math.hypot(target.x - excursion.x, target.y - excursion.y)) : 1);
            excursion.x += (target.x - excursion.x) * ease; excursion.y += (target.y - excursion.y) * ease;
            ceiling = target.ceiling; grip = target.grip; side = target.side; hide = target.hide; float = target.float; hop = target.hop; vanish = target.vanish;
            const done = returning && Math.hypot(excursion.x, excursion.y) < .5;
            if (done) excursion = { x: 0, y: 0 };
            if (elapsed >= moveAt && !motionBusy && (done || Math.hypot(excursion.x - sent.x, excursion.y - sent.y) > .2)) {
              moveAt = elapsed + (s.batterySaver || cursor.battery ? 1000 / 30 : 1000 / 60);
              sent = { ...excursion }; motionBusy = true;
              void movePet(sent.x, sent.y, done, wallTrip).catch(reportError).finally(() => { motionBusy = false; });
              if (done) { returning = false; wallTrip = false; }
            }
          }
          scene.alpha = s.opacity * (1 - (machine.state === 'TELEPORTING' && motionBusy ? 1 : vanish));
          climate.update(elapsed / 1000, s, machine.state, s.reducedMotion || s.batterySaver || cursor.battery);
          animator.motion = { ceiling, speed: dt ? (excursion.x - previousX) / dt : 0, grip, side, hide, float, hop };
          animator.actionTime = machine.actionSeconds;
          animator.update(rig, elapsed / 1000, dt, cursor, s);
          if (s.reducedMotion) { pip.position.set(machine.state === 'SLEEPING' ? 220 : 243, machine.state === 'SLEEPING' ? 299 : 115); pip.rotation = 0; }
          else pip.update(elapsed / 1000, dt, machine.state === 'SLEEPING', machine.state === 'PLAYING', machine.state === 'TYPING' || machine.state === 'WRITING', animator.pose.jump);
          particles.update(dt, effects);
          if (effects && machine.state !== 'SLEEPING' && elapsed > particleAt && ticker.FPS > 24) { particleAt = elapsed + 1800; particles.spawn(machine.state === 'PLAYING' ? 'butterfly' : machine.state === 'DRINKING_TEA' ? 'bubble' : machine.state === 'DANCING' ? 'star' : 'dust', 207, 105, s.particles); }
          if (elapsed > statsAt) { statsAt = elapsed + 10000; if (s.stats && machine.state === 'SLEEPING') { const stats = usePetStore.getState().stats; usePetStore.getState().setStats({ ...stats, energy: Math.min(100, stats.energy + 1) }); } }

        }
        if (native && regionClock >= regionAt && !regionBusy) {
          regionAt = regionClock + (s.batterySaver || cursor.battery ? 66 : 33); regionBusy = true;
          const bounds = [...[rig.desk,rig.notebook,rig.snacks,rig.plant,rig.caption,...rig.signatureProps,...rig.weatherProps].filter(p=>p.visible).map(p=>p.getBounds()), ...climate.regions(), ...rig.hitParts.filter(part => part.visible && part.alpha > .01).map(part => part.getBounds()), ...(rig.blanket.visible ? [rig.quilt.getBounds(), rig.pillow.getBounds(), rig.moon.getBounds(), ...rig.nightStars.map(star => star.getBounds())] : []), ...(rig.cup.visible ? [rig.cup.getBounds()] : []), ...(rig.laptop.visible ? [rig.laptop.getBounds()] : []), ...(rig.balloons.visible ? [...rig.balloonParts.map(p => p.getBounds()), rig.strings.getBounds()] : []), ...(pip.visible ? [pip.getBounds()] : []), ...particles.regions(), rig.shadow.getBounds()];
          // Elliptical visual envelopes also define the real Windows input region.
          const regions: HitEllipse[] = bounds.filter(b => b.width > 0 && b.height > 0).map(b => {
            const x = Math.max(0, b.x - 3), y = Math.max(0, b.y - 3);
            return { x, y, rectangular: s.character !== 'mochi' || rig.caption.visible || rig.desk.visible || rig.weatherProps.some(p=>p.visible), width: Math.min(320, b.x + b.width + 3) - x, height: Math.min(340, b.y + b.height + 3) - y };
          }).filter(b => b.width > 0 && b.height > 0).slice(0,64);
          void setRegions(regions).catch(reportError).finally(() => { regionBusy = false; });
        }
        if (import.meta.env.DEV && host.current) host.current.dataset.fps = String(Math.round(ticker.FPS));
      });
      cleanup = () => { unsubscribe(); clearTimeout(clickTimer); clearInterval(statsTimer); window.removeEventListener('keydown', previewKey); window.removeEventListener('mochi-drag-ended', cancel); window.removeEventListener('mochi-position-reset', resetExcursion); cancel(); app.destroy(true, { children: true }); };
    };
    initialize().catch(reportError);
    return () => { disposed = true; cleanup(); };
  }, [preview]);
  return <div className="pet-canvas" ref={host} aria-label="Mochi, your animated desktop companion" role="img" />;
}

