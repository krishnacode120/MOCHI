import { Container, Graphics } from 'pixi.js';
import type { MochiRig } from './mochi/artwork';
import type { CharacterRig } from './createCharacter';
import type { PetState } from '../types';
import { envelope, punchExtension, smooth } from '../engine/animation/timing';
const line = { color: 0x30333a, width: 2, join: 'round' as const };
export function createSignatureProps(r: MochiRig) {
    const web = new Graphics(), sense = new Graphics(), meat = new Container();
    meat.addChild(new Graphics().roundRect(-44, -5, 88, 10, 5).fill(0xfff2d4).stroke(line).circle(-43, -5, 7).circle(-43, 5, 7).circle(43, -5, 7).circle(43, 5, 7).fill(0xfff2d4).stroke(line).roundRect(-30, -23, 60, 46, 18).fill(0x9b4c27).stroke(line).ellipse(-7, -9, 18, 6).fill(0xc97a3b).moveTo(-17, -17).lineTo(-13, 15).moveTo(3, -17).lineTo(7, 15).moveTo(18, -15).lineTo(21, 11).stroke({ color: 0x713c24, width: 3 }));
    const cube = new Graphics().poly([-21, -22, 17, -22, 27, -13, -11, -13]).fill(0x9f8d6c).stroke(line).poly([-21, -22, -11, -13, -11, 15, -21, 7]).fill(0x665d4d).stroke(line).rect(-11, -13, 38, 28).fill(0x8c7e64).stroke(line);
    for (let i = 0; i < 5; i++)
        cube.moveTo(-7 + i * 7, -10).lineTo(-3 + i * 6, 10).stroke({ color: 0x574e41, width: 1.4 });
    const treasure = new Graphics().ellipse(0, -8, 12, 15).fill(0xe6d5a2).stroke(line).roundRect(-6, 5, 12, 10, 2).fill(0x838f92).stroke(line).moveTo(-5, -4).lineTo(0, 5).lineTo(5, -4).stroke({ color: 0xb28d41, width: 1.5 });
    const solar = new Container();
    for (const x of [-104, 47]) {
        const panel = new Graphics().rect(x, -76, 57, 38).fill(0x2b526e).stroke(line);
        for (let col = 1; col < 4; col++)
            panel.moveTo(x + col * 14, -74).lineTo(x + col * 14, -40);
        for (let row = 1; row < 3; row++)
            panel.moveTo(x + 2, -76 + row * 13).lineTo(x + 55, -76 + row * 13);
        panel.stroke({ color: 0x8eaab8, width: 1 });
        solar.addChild(panel);
    }
    for (const prop of [web, sense, meat, cube, treasure, solar]) {
        prop.visible = false;
        prop.alpha = 0;
        r.rig.addChild(prop);
    }
    return { web, sense, meat, cube, treasure, solar, signatureProps: [web, sense, meat, cube, treasure, solar] };
}
export function animateSignature(r: CharacterRig, state: PetState, age: number, dt: number, gentle: boolean, sleep: number) {
    const blend = 1 - Math.exp(-dt * 12), mix = (a: number, b: number) => a + (b - a) * blend;
    const show = (c: Container, on: boolean) => { c.alpha = mix(c.alpha, on ? 1 : 0); c.visible = c.alpha > .01; };
    show(r.web, state === 'WEB_SHOOTING' || state === 'WEB_SWINGING');
    show(r.sense, state === 'SPIDER_SENSE');
    show(r.meat, state === 'EATING_MEAT');
    show(r.cube, state === 'COMPACTING');
    show(r.treasure, state === 'INSPECTING' || state === 'TREASURE_PATROL' && (age >= 7 && age <= 9 || age >= 15 && age <= 17));
    show(r.solar, state === 'RECHARGING');
    r.hat.y = mix(r.hat.y, state === 'HAT_TIP' ? -12 * envelope(age, 5) : 0);
    r.hat.rotation = mix(r.hat.rotation, state === 'HAT_TIP' ? -.12 * envelope(age, 5) : 0);
    r.leftArm.scale.set(1);
    r.rightArm.scale.y = mix(r.rightArm.scale.y, state === 'GUM_PUNCH' ? 1 + (gentle ? .3 : punchExtension(age)) * 1.15 * envelope(age, 6) : 1);
    if (r.character === 'spiderman') {
        r.pupils.forEach(p => p.visible = false);
        r.mouth.visible = r.yawn.visible = false;
        if (state === 'WEB_SHOOTING' || state === 'WEB_SWINGING') {
            const swing = state === 'WEB_SWINGING', power = envelope(age, swing ? 24 : 5);
            r.rightArm.rotation = (swing ? 2.8 : -2.1) * power;
            r.leftArm.rotation = mix(r.leftArm.rotation, .7 * power);
            r.web.clear();
            const reach = gentle ? 1 : smooth((age % 1.6) / .25);
            const startX = r.rightArm.x - Math.sin(r.rightArm.rotation) * 48, startY = r.rightArm.y + Math.cos(r.rightArm.rotation) * 48;
            const endX = swing ? 10 : 142, endY = swing ? -245 : -154;
            r.web.moveTo(startX, startY).lineTo(startX + (endX - startX) * reach, startY + (endY - startY) * reach).stroke({ color: 0x596a78, width: 4, alpha: .75 });
            r.web.moveTo(startX, startY).lineTo(startX + (endX - startX) * reach, startY + (endY - startY) * reach).stroke({ color: 0xf3f6ff, width: 2 });
            if (!swing)
                for (let i = 0; i < 5; i++) {
                    const a = i * Math.PI * 2 / 5;
                    r.web.moveTo(endX, endY).lineTo(endX + Math.cos(a) * 10, endY + Math.sin(a) * 10).stroke({ color: 0xe8f0ff, width: 1.5, alpha: reach });
                }
            r.web.alpha = power;
            if (swing && !gentle) {
                r.rig.rotation = Math.sin(age * 1.2) * .22 * power;
                r.leftLeg.rotation = -.45 * power;
                r.rightLeg.rotation = .6 * power;
            }
        }
        if (state === 'SPIDER_SENSE') {
            const power = envelope(age, 4.5);
            r.sense.clear();
            for (let i = 0; i < 7; i++) {
                const a = Math.PI + i * Math.PI / 6;
                const inner = 62, outer = gentle ? 74 : 74 + Math.sin(age * 5) * 4;
                r.sense.moveTo(Math.cos(a) * inner, -122 + Math.sin(a) * inner).lineTo(Math.cos(a) * outer, -122 + Math.sin(a) * outer).stroke({ color: 0xe8b34d, width: 3, alpha: power });
            }
            r.head.rotation = mix(r.head.rotation, gentle ? 0 : Math.sin(age * 2) * .16 * power);
        }
    }
    if (r.character === 'luffy') {
        if (state === 'GUM_ROCKET') {
            const power=envelope(age,18);
            r.leftArm.rotation=-2.5*power;r.rightArm.rotation=2.5*power;
            r.hat.rotation=gentle?0:Math.sin(age*2)*.08*power;
            r.rig.rotation=gentle?0:Math.sin(age*Math.PI/6)*.14*power;
        }
        if (state === 'GUM_PUNCH') {
            const power = envelope(age, 6), extension = gentle ? .3 : punchExtension(age);
            r.rightArm.rotation = -Math.PI / 2 * power;
            r.leftArm.rotation = mix(r.leftArm.rotation, .9 * power);
            r.head.rotation = mix(r.head.rotation, -.08 * extension * power);
        }
        if (state === 'EATING_MEAT') {
            const bite = gentle ? 0 : Math.max(0, Math.sin(age * 3));
            r.meat.position.set(0, -65 - bite * 12);
            r.meat.rotation = gentle ? 0 : Math.sin(age * 2) * .06;
            const power = envelope(age, 9);
            r.leftArm.rotation = -2.2 * power;
            r.rightArm.rotation = 2.2 * power;
            r.mouth.scale.y = 1 + bite * .12;
        }
        if (state === 'HAT_TIP')
            r.rightArm.rotation = 2.85 * envelope(age, 5);
    }
    if (r.character === 'walle') {
        // Rigid chassis and planted treads replace the inherited humanoid walk cycle.
        r.leftLeg.rotation = r.rightLeg.rotation = 0;
        r.body.scale.y = 1;
        r.rig.scale.y = 1;
        r.yawn.visible = r.mouth.visible = false;
        r.eyes.scale.y = 1;
        const curious = state === 'INSPECTING' || state === 'CURIOUS' || state === 'WATCHING';
        r.lenses.forEach((lens, i) => { lens.rotation = mix(lens.rotation, (i ? 1 : -1) * (sleep * .22 + (curious ? .14 : 0))); lens.scale.y = mix(lens.scale.y, 1 - sleep * .7); });
        if (state === 'INSPECTING' || state === 'TREASURE_PATROL') {
            const power = state === 'TREASURE_PATROL' ? Math.max(envelope(age-7,2,.3),envelope(age-15,2,.3)) : envelope(age,7);
            r.treasure.position.set(52, -90);
            r.treasure.rotation = gentle ? 0 : Math.sin(age * 1.5) * .35;
            r.head.rotation = mix(r.head.rotation, .22 * power);
            r.rightArm.rotation = 2.5 * power;
        }
        if (state === 'COMPACTING') {
            const squeeze = gentle ? .5 : Math.sin(Math.PI * Math.min(1, age / 3)) ** 2;
            r.leftArm.rotation = mix(r.leftArm.rotation, -.95 * squeeze);
            r.rightArm.rotation = mix(r.rightArm.rotation, .95 * squeeze);
            r.cube.position.set(0, -23 + smooth((age - 3) / 2) * 48);
            r.cube.scale.set(.65 + .35 * smooth((age - 2) / 1));
            r.cube.alpha = smooth((age - 1) / 1) * smooth((8 - age) / .6);
        }
        if (state === 'RECHARGING') {
            r.solar.scale.x = smooth(age / .8) * smooth((10 - age) / .8);
            r.head.rotation = mix(r.head.rotation, -.1);
        }
        if (state === 'COLLECTING')
            r.head.rotation = mix(r.head.rotation, .14);
    }
    if (state !== 'EATING_MEAT')
        r.mouth.scale.y = mix(r.mouth.scale.y, 1);
    if (gentle)
        r.treasure.rotation = r.meat.rotation = 0;
}
