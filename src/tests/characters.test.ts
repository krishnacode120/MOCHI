import { describe, expect, it } from 'vitest';
import { defaults, validateSettings } from '../stores/settings';
import { idleChoices, signatureActions, supportsState } from '../characters/profiles';
import { Behavior } from '../engine/behavior/Behavior';
import { PetMachine } from '../engine/stateMachine/PetMachine';
import { poseTargets, punchExtension } from '../engine/animation/timing';
import type { CursorSample, PetState } from '../types';
import { createMochi } from '../characters/mochi/artwork';
import { drawCharacter } from '../characters/artwork';
import { createCharacter } from '../characters/createCharacter';
import { Animator } from '../engine/animation/Animator';
import { adventure } from '../engine/physics/adventures';
const cursor: CursorSample = { x: 0, y: 0, localX: 800, localY: 800, velocity: 0, stationaryMs: 0, idleMs: 0, fullscreen: false, battery: false, visible: true, typing: false };
describe('character behavior regressions', () => {
    it('keeps the inverted ceiling pose inside the pet canvas', () => {
        const settings = { ...defaults, character: 'spiderman' as const, followCursor: false };
        const rig = createCharacter(settings), animator = new Animator();
        animator.transition('CEILING_CRAWLING', false, 1);
        for (let frame = 0; frame <= 32 * 30; frame++) {
            const age = frame / 30;
            const p = adventure('CEILING_CRAWLING', age, { left: -1000, right: 100, top: -600, bottom: 30 }, 180, true);
            animator.motion = { ...p, speed: 0 };
            animator.actionTime = age;
            animator.update(rig, age, 1 / 30, cursor, settings);
            for (const part of rig.hitParts.filter(part => part.visible)) {
                const b = part.getBounds();
                if (!b.width || !b.height) continue;
                expect(b.x).toBeGreaterThanOrEqual(0);
                expect(b.y).toBeGreaterThanOrEqual(0);
                expect(b.x + b.width, `age=${age}, x=${rig.rig.x}, angle=${rig.rig.rotation}, scale=${rig.rig.scale.x}, part=${rig.hitParts.indexOf(part)}`).toBeLessThanOrEqual(320);
                expect(b.y + b.height).toBeLessThanOrEqual(340);
            }
        }
        rig.root.destroy({ children: true });
    });
    it('starts WALL-E pupils inside the binocular housings even before animation runs', () => {
        const rig = createMochi('peach');
        const art = drawCharacter(rig, 'walle');
        rig.pupils.forEach((pupil, i) => {
            expect(pupil.parent).toBe(art.lenses[i]);
            expect(pupil.x).toBe(0);
            expect(pupil.y).toBe(0);
        });
        rig.root.destroy({ children: true });
    });
    it('keeps signature behaviors with their character and removes travel in reduced motion', () => {
        for (const character of Object.keys(signatureActions) as (keyof typeof signatureActions)[]) {
            expect(validateSettings({ character }).character).toBe(character);
            for (const state of idleChoices({ ...defaults, character }))
                expect(supportsState(character, state)).toBe(true);
            expect(idleChoices({ ...defaults, character, reducedMotion: true })).not.toContain('WEB_SWINGING');
        }
        expect(idleChoices({ ...defaults, character: 'walle' })).not.toContain('CLIMBING');
        expect(idleChoices({ ...defaults, character: 'spiderman' })).toContain('CLIMBING');
        expect(idleChoices({ ...defaults, character: 'luffy' })).toContain('EATING_MEAT');
    });
    it('avoids the last three spontaneous choices even with a repeated random value', () => {
        const b = new Behavior(() => 0), m = new PetMachine();
        const seen: PetState[] = [];
        for (let i = 0; i < 9; i++) {
            const now = 20000 + i * 50000;
            m.request('IDLE', 'user', now - 1);
            b.update(now, m, defaults, cursor);
            expect(seen.slice(-3)).not.toContain(m.state);
            seen.push(m.state);
        }
    });
    it('clears queued character-specific actions when switching characters', () => {
        const m = new PetMachine();
        m.request('SLEEPING', 'user', 0);
        m.request('GUM_PUNCH', 'user', 1);
        m.resetCharacter(50);
        m.tick(4000);
        expect(m.state).toBe('IDLE');
        m.request('PAUSED', 'user', 5000);
        m.resetCharacter(6000);
        expect(m.state).toBe('PAUSED');
        m.resume(7000);
        expect(m.state).toBe('IDLE');
    });
    it('uses action age for poses and brings punches and jumps back to rest', () => {
        expect(poseTargets('JUMPING', .7, false).jump).toBeLessThan(-20);
        expect(poseTargets('JUMPING', 1.5, false).jump).toBeCloseTo(0);
        expect(poseTargets('DRINKING_TEA', 3, false).cup).toBe(1);
        expect(poseTargets('WAVING', 1, true).wave).toBe(0);
        expect(punchExtension(.8)).toBe(1);
        expect(punchExtension(1.7)).toBe(0);
    });
});
