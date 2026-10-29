import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import 'pixi.js/unsafe-eval';
import { createCharacter } from '../../characters/createCharacter';
import { Animator } from '../../engine/animation/Animator';
import { usePetStore } from '../../stores/settings';
import { names } from '../../characters/profiles';
import { cursor } from '../../services/native';
/** A single rendered frame of the real rig, with no activity timers or desktop effects. */
export function CharacterPortrait() {
    const host = useRef<HTMLDivElement>(null);
    const character = usePetStore(s => s.settings.character), outfit = usePetStore(s => s.settings.outfit);
    useEffect(() => {
        const app = new Application();
        let disposed = false, ready = false;
        void (async () => {
            await app.init({ width: 320, height: 340, backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true, autoStart: false, preference: 'webgl' });
            ready = true;
            if (disposed) {
                app.destroy(true, { children: true });
                return;
            }
            const s = { ...usePetStore.getState().settings, character, outfit, reducedMotion: true, followCursor: false };
            const rig = createCharacter(s);
            app.stage.addChild(rig.root);
            new Animator().update(rig, 0, 1 / 60, cursor, s);
            host.current?.appendChild(app.canvas);
            app.render();
        })().catch(error => console.error('Character preview failed', error));
        return () => { disposed = true; if (ready)
            app.destroy(true, { children: true }); };
    }, [character, outfit]);
    return <div ref={host} className="pet-canvas" role="img" aria-label={names[character]}/>;
}
