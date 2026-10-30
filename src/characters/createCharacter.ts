import { proportions } from './proportions';
import { createWeatherWardrobe } from './weather';
import { envelope } from '../engine/animation/timing';
import { drawCharacter } from './artwork';
import { createSignatureProps, animateSignature } from './signature';
import { Container, Graphics, Text } from 'pixi.js';
import { createMochi } from './mochi/artwork';
import type { Settings, PetState } from '../types';
const ink = 0x51435f;
const line = { color: ink, width: 2.2 };
export function createCharacter(settings: Settings) {
    const r = createMochi(settings.outfit);
    const character = settings.character;
    const { nose, hat, lenses, eyeSpacing } = drawCharacter(r, character);
    const signature = createSignatureProps(r);
    const desk = new Container();
    desk.y = 8;
    desk.addChild(new Graphics().roundRect(-76, -3, 152, 12, 5).fill(0xc69f78).stroke(line).roundRect(-64, 9, 9, 30, 3).roundRect(55, 9, 9, 30, 3).fill(0xa67d5b).stroke(line));
    const notebook = new Container();
    notebook.position.set(-5, 1);
    notebook.addChild(new Graphics().roundRect(-30, -15, 60, 20, 3).fill(0xfffcf4).stroke({ color: 0xa99bb6, width: 1.5 }).moveTo(0, -13).lineTo(0, 4).moveTo(-23, -8).lineTo(-6, -8).moveTo(-23, -3).lineTo(-10, -3).moveTo(7, -8).lineTo(24, -8).stroke({ color: 0xbaa8cb, width: 1.4 }));
    const pencil = new Graphics().moveTo(0, 0).lineTo(19, -27).stroke({ color: 0xe4bb6a, width: 4 }).moveTo(0, 0).lineTo(-2, 4).stroke({ color: ink, width: 2 });
    pencil.position.set(16, -2);
    notebook.addChild(pencil);
    const snacks = new Container();
    snacks.position.set(0, -5);
    const popcorn = new Graphics().poly([-54, -26, -18, -26, -22, 10, -50, 10]).fill(0xfff5df).stroke(line);
    for (let x = -48; x < -20; x += 10)
        popcorn.rect(x, -23, 4, 30).fill(0xdc8e9c);
    for (let i = 0; i < 9; i++)
        popcorn.circle(-53 + (i % 5) * 8, -28 - Math.floor(i / 5) * 7, 6).fill(0xffe9aa).stroke({ color: 0xd5b46f, width: .8 });
    const cola = new Graphics().poly([27, -30, 53, -30, 49, 12, 31, 12]).fill(0xa473b4).stroke(line).ellipse(40, -30, 14, 4).fill(0xfff9e6).stroke(line).moveTo(43, -30).lineTo(47, -54).lineTo(58, -56).stroke({ color: 0xd9958d, width: 3 }).circle(40, -9, 6).fill(0xffe2aa);
    snacks.addChild(popcorn, cola);
    const plant = new Container();
    plant.position.set(5, -23);
    plant.addChild(new Graphics().roundRect(-17, 4, 34, 20, 4).fill(0x967855).stroke(line).moveTo(0, 5).lineTo(0, -32).stroke({ color: 0x5c8b68, width: 3 }).ellipse(-10, -21, 11, 5).ellipse(10, -32, 11, 5).fill(0x96b68a).stroke({ color: 0x5c8b68, width: 1.5 }));
    if (character === 'walle') {
        (plant.children[0] as Graphics).clear().poly([-18, 12, -13, -8, 5, -8, 8, 4, 24, 8, 25, 22, -20, 22]).fill(0x836447).stroke(line).moveTo(-3, 5).lineTo(-3, -27).stroke({ color: 0x5c8b68, width: 3 }).ellipse(-12, -19, 10, 5).ellipse(7, -27, 10, 5).fill(0x8ab476);
    }
    r.rig.addChild(desk, notebook, snacks, plant);
    r.rig.addChild(r.leftArm, r.rightArm, r.blanket);
    const caption = new Container();
    caption.position.set(28, 10);
    caption.addChild(new Graphics().roundRect(0, 0, 264, 44, 14).fill({ color: 0xfffbef, alpha: .96 }).stroke({ color: 0xd9c9e4, width: 1.4 }));
    const words = new Text({ text: '', style: { fontFamily: 'Segoe UI', fontSize: 13, fill: ink, align: 'center', wordWrap: true, wordWrapWidth: 246 } });
    words.anchor.set(.5);
    words.position.set(132, 22);
    caption.addChild(words);
    r.root.addChild(caption);
    for (const part of [desk, notebook, snacks, plant, caption]) {
        part.visible = false;
        part.alpha = 0;
    }
    const wardrobe = createWeatherWardrobe(r, character);
    return { ...r, ...signature, ...wardrobe, proportions: proportions[character], character, eyeSpacing, nose, hat, lenses, desk, notebook, pencil, snacks, plant, caption, words };
}
export type CharacterRig = ReturnType<typeof createCharacter>;
const thoughts = ['Do clouds ever get tired?', 'Growing is quite an adventure.', 'A little kindness goes a long way.'];
export function updateCharacter(r: CharacterRig, state: PetState, time: number, age: number, dt: number, gentle: boolean, sleep: number) {
    const ease = 1 - Math.exp(-dt * 9), working = state === 'TYPING' || state === 'WRITING';
    const show = (part: Container, target: boolean) => { part.alpha += ((target ? 1 : 0) - part.alpha) * ease; part.visible = part.alpha > .015; };
    show(r.desk, working);
    show(r.notebook, state === 'WRITING');
    show(r.snacks, state === 'MOVIE');
    show(r.plant, state === 'COLLECTING');
    r.laptop.visible &&= state !== 'WRITING';
    r.pencil.rotation = gentle ? 0 : Math.sin(time * 5) * .12;
    r.leftArm.y += ((working ? -35 : -55) - r.leftArm.y) * ease;
    r.rightArm.y += ((working ? -35 : -55) - r.rightArm.y) * ease;
    const unfold = r.character === 'olaf' && state === 'REASSEMBLING' && !gentle ? Math.sin(Math.PI * Math.min(1, age / 6.5)) ** 2 : 0;
    r.body.y += (-12 * unfold - r.body.y) * ease;
    r.head.y -= 25 * unfold;
    const shoulder = r.character === 'walle' ? 50 : r.character === 'mochi' ? 44 : 31;
    r.leftArm.x = -shoulder - 27 * unfold;
    r.rightArm.x = shoulder + 27 * unfold;
    r.nose.x = unfold * Math.sin(age * 4) * 27;
    r.nose.y = (r.character === 'olaf' ? 20 : 28) - unfold * 18;
    if (unfold > 0)
        r.head.rotation = Math.sin(age * 2) * .6 * unfold;
    if (r.character === 'olaf' && ['WALKING', 'RUNNING', 'PLAYING'].includes(state) && !gentle)
        r.rig.rotation = Math.sin(time * 6) * .065;
    if (state === 'HUGGING') {
        const reach = (gentle ? .6 : 1) * envelope(age, 5);
        r.leftArm.rotation += (-1.4 * reach - r.leftArm.rotation) * ease;
        r.rightArm.rotation += (1.4 * reach - r.rightArm.rotation) * ease;
    }
    if (state === 'STORYTELLING') {
        const weight = envelope(age, 9);
        r.leftArm.rotation += ((gentle ? .4 : Math.sin(age * 4) * 1.1) * weight - r.leftArm.rotation) * ease;
        r.rightArm.rotation += ((gentle ? -.4 : Math.cos(age * 4) * 1.1) * weight - r.rightArm.rotation) * ease;
        r.head.rotation += ((gentle ? 0 : Math.sin(age * 2) * .15) * weight - r.head.rotation) * ease;
    }
    if (state === 'SUNBATHING') {
        const weight = envelope(age, 8);
        r.leftArm.rotation += (.8 * weight - r.leftArm.rotation) * ease;
        r.rightArm.rotation += (-.8 * weight - r.rightArm.rotation) * ease;
        r.eyes.scale.y *= 1 - .5 * weight;
    }
    if (state === 'MOVIE') {
        r.leftArm.rotation += (-.5 + (gentle ? 0 : Math.sin(time * 2) * .18) - r.leftArm.rotation) * ease;
        r.rightArm.rotation += (.5 - r.rightArm.rotation) * ease;
        r.head.rotation += ((gentle ? 0 : Math.sin(time * .65) * .035) - r.head.rotation) * ease;
    }
    if (state === 'COLLECTING') {
        const weight = envelope(age, 8.5);
        r.leftArm.rotation += (-.6 * weight - r.leftArm.rotation) * ease;
        r.rightArm.rotation += (.6 * weight - r.rightArm.rotation) * ease;
    }

    const message = state === 'HUGGING' ? 'A warm hug?' : state === 'WONDERING' ? thoughts[Math.floor(age / 2.4) % thoughts.length] : state === 'STORYTELLING' ? ['And then... a grand adventure!', 'There was a surprise!', 'And everyone found a friend.'][Math.min(2, Math.floor(age / 3))] : state === 'REASSEMBLING' ? 'Oops! All here again.' : state === 'SUNBATHING' ? 'Summer looks lovely!' : state === 'COLLECTING' ? 'A little green friend.' : '';
    animateSignature(r, state, age, dt, gentle, sleep);
    r.words.text = message;
    r.caption.alpha = 1;
    r.caption.visible = Boolean(message) && sleep < .1;
}
