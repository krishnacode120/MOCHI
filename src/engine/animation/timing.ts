import type { PetState } from '../../types';
export const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
export function envelope(age: number, duration: number, fade = .5) { return smooth(age / fade) * smooth((duration - age) / fade); }
export function punchExtension(age: number) {
    const beat = Math.max(0, age) % 1.8;
    return smooth((beat - .45) / .22) * (1 - smooth((beat - .9) / .6));
}
export function poseTargets(state: PetState, age: number, gentle: boolean) {
    const p = { jump: 0, squash: 1, wave: 0, sleep: state === 'SLEEPING' ? 1 : 0, cup: 0, desk: state === 'TYPING' || state === 'WRITING' ? 1 : 0 };
    if (state === 'DRINKING_TEA')
        p.cup = envelope(age, 6.5, .8);
    if (gentle)
        return p;
    if (state === 'JUMPING') {
        p.jump = -34 * Math.sin(Math.PI * smooth((age - .3) / .8));
        p.squash = 1 - .1 * envelope(age, .35, .12) + .04 * envelope(age - .35, .65, .2) - .06 * envelope(age - 1, .4, .15);
    }
    if (state === 'WAVING')
        p.wave = (-2 + .25 * Math.sin(age * 15)) * envelope(age, 2.6, .4);
    if (state === 'WAKING')
        p.wave = -1.5 * envelope(age, 2.8, .8);
    return p;
}
