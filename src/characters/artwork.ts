import { Container, Graphics } from 'pixi.js';
import type { MochiRig } from './mochi/artwork';
import type { Settings } from '../types';
const ink = 0x272c35;
const outline = { color: ink, width: 2.2, join: 'round' as const };
const skin = 0xf4c49a;
function empty(c: Container) { c.removeChildren().forEach(child => child.destroy({ children: true })); }
function webPattern(g: Graphics, cx: number, cy: number, rx: number, ry: number) {
    for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5;
        g.moveTo(cx, cy).lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    }
    for (const size of [.35, .65, .95]) {
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI / 5, b = (i + 1) * Math.PI / 5;
            g.moveTo(cx + Math.cos(a) * rx * size, cy + Math.sin(a) * ry * size)
                .quadraticCurveTo(cx + Math.cos((a + b) / 2) * rx * size * .86, cy + Math.sin((a + b) / 2) * ry * size * .86, cx + Math.cos(b) * rx * size, cy + Math.sin(b) * ry * size);
        }
    }
    g.stroke({ color: 0x242935, width: 1.1, alpha: .85 });
}
/** Each silhouette has its own geometry; only articulated attachment points are shared. */
export function drawCharacter(r: MochiRig, character: Settings['character']) {
    const nose = new Container(), hat = new Container();
    const lenses = [new Container(), new Container()];
    let eyeSpacing = 25;
    if (character === 'mochi')
        return { nose, hat, lenses, eyeSpacing };
    for (const child of r.head.children)
        child.visible = false;
    for (const child of r.body.children)
        child.visible = false;
    empty(r.hair);
    empty(r.leftArm);
    empty(r.rightArm);
    for (const child of [...r.eyes.children]) {
        if (r.pupils.includes(child as Graphics)) {
            r.eyes.removeChild(child);
            empty(child);
            (child as Graphics).clear();
        }
        else {
            r.eyes.removeChild(child);
            child.destroy({ children: true });
        }
    }
    r.leftLeg.clear();
    r.rightLeg.clear();
    r.mouth.clear();
    r.yawn.clear();
    r.lids.clear();
    const face = new Graphics(), torso = new Graphics();
    r.head.addChildAt(face, 0);
    r.body.addChild(torso);
    r.head.addChild(r.hair, r.eyes, r.lids, r.mouth, r.yawn, nose, hat);
    r.eyes.visible = r.hair.visible = r.mouth.visible = true;
    r.eyes.y = 10;
    if (character === 'walle') {
        eyeSpacing = 31;
        r.eyes.y = 3;
        // Telescoping neck, weathered compactor chassis, chest panel and tank treads.
        torso.rect(-9, -111, 18, 42).fill(0x737b7b).stroke(outline).rect(-5, -110, 5, 39).fill(0xb2b9b5);
        torso.roundRect(-51, -75, 102, 86, 5).fill(0xb68228).stroke(outline)
            .poly([-51, -75, -42, -83, 45, -83, 51, -75]).fill(0xe0b44c).stroke(outline)
            .rect(-44, -67, 88, 66).fill(0xd2a13c).stroke({ color: 0x775a2f, width: 2 })
            .rect(-44, -67, 88, 16).fill(0x434c4c).stroke(outline)
            .rect(-38, -63, 30, 8).fill(0x526571).rect(-34, -61, 15, 4).fill(0x96c4ce)
            .circle(34, -59, 4).fill(0xb34c32).circle(22, -59, 2).fill(0xf9d272)
            .roundRect(-31, -42, 62, 34, 2).fill(0xb68a3b).stroke(outline)
            .rect(-21, -35, 42, 4).fill(0x655a42).rect(-25, -24, 50, 2).fill(0xe6bc67);
        for (const [x, y] of [[-45, -44], [42, -21], [-33, -7], [25, 4], [-10, -73]])
            torso.moveTo(x, y).lineTo(x + 7, y - 3).stroke({ color: 0x80602f, width: 2 });
        for (const [i, lens] of lenses.entries()) {
            const direction = i ? 1 : -1;
            lens.x = direction * eyeSpacing;
            const shell = new Graphics().poly([-27, -21, -12, -28, 22, -20, 29, 9, 16, 25, -20, 23, -29, 7]).fill(0x737d7e).stroke(outline);
            shell.circle(0, 1, 21).fill(0xadb7af).stroke({ color: 0x323c41, width: 3 }).circle(0, 1, 17).fill(0x192b38).stroke({ color: 0x596c76, width: 2 });
            const pupil = r.pupils[i];
            pupil.circle(0, 0, 10).fill(0x090f18).circle(-5, -5, 4).fill(0xd6e9e9).circle(5, 7, 2).fill(0x709ba7);
            pupil.position.set(0, 0);
            pupil.visible = true;
            lens.addChild(shell, pupil);
            r.eyes.addChild(lens);
        }
        face.roundRect(-12, -4, 24, 13, 3).fill(0x8b9895).stroke(outline);
        for (const arm of [r.leftArm, r.rightArm])
            arm.addChild(new Graphics().roundRect(-7, 0, 14, 34, 3).fill(0x9aa19a).stroke(outline).rect(-10, 27, 20, 10).fill(0x757c76).stroke(outline).rect(-13, 36, 8, 18).rect(-3, 36, 8, 20).rect(7, 36, 8, 17).fill(0xb5b6a6).stroke(outline));
        for (const leg of [r.leftLeg, r.rightLeg]) {
            leg.poly([-24, -18, 15, -18, 25, 28, -27, 28]).fill(0x353e40).stroke(outline);
            leg.circle(-6, 0, 13).circle(9, 17, 8).circle(-15, 17, 8).fill(0x67706b).stroke({ color: 0x202a2d, width: 2 });
            for (let y = -14; y < 28; y += 7)
                leg.moveTo(-23, y).lineTo(-17, y).moveTo(15, y).lineTo(21, y).stroke({ color: 0x93958a, width: 3 });
        }
    }
    else if (character === 'olaf') {
        eyeSpacing = 16;
        r.eyes.y = 1;
        torso.ellipse(0, -50, 31, 31).ellipse(0, 3, 48, 42).fill(0xfffefd).stroke(outline);
        torso.circle(0, -61, 5).circle(0, -42, 5).circle(0, -5, 6).fill(0x36373a);
        face.moveTo(-30, 25).bezierCurveTo(-55, -30, -26, -70, 8, -66).bezierCurveTo(35, -63, 47, -24, 29, 30).quadraticCurveTo(0, 65, -30, 25).fill(0xfffefd).stroke(outline);
        r.hair.addChild(new Graphics().moveTo(-8, -62).lineTo(-18, -86).moveTo(1, -65).lineTo(0, -91).moveTo(10, -64).lineTo(22, -84).stroke({ color: 0x62492f, width: 3, cap: 'round' }));
        face.moveTo(-27, -18).quadraticCurveTo(-18, -26, -8, -17).moveTo(6, -18).quadraticCurveTo(15, -27, 25, -20).stroke({ color: 0x55412e, width: 3, cap: 'round' });
        nose.addChild(new Graphics().moveTo(-9, -6).quadraticCurveTo(15, -9, 44, 1).quadraticCurveTo(22, 12, -7, 8).closePath().fill(0xf49732).stroke({ color: 0xb86523, width: 1.5 }).moveTo(2, -5).lineTo(5, 6).moveTo(15, -3).lineTo(17, 5).stroke({ color: 0xd37925, width: 1 }));
        nose.position.set(0, 20);
        r.mouth.moveTo(-24, 28).quadraticCurveTo(0, 65, 25, 26).quadraticCurveTo(0, 41, -24, 28).fill(0x323d49).stroke(outline).roundRect(-9, 32, 17, 13, 2).fill(0xffffff).stroke({ color: 0xa5b5bf, width: 1 });
        for (const arm of [r.leftArm, r.rightArm])
            arm.addChild(new Graphics().moveTo(0, 0).lineTo(2, 32).lineTo(-10, 44).moveTo(2, 32).lineTo(4, 49).moveTo(2, 32).lineTo(16, 40).stroke({ color: 0x715333, width: 3.5, cap: 'round' }));
        for (const leg of [r.leftLeg, r.rightLeg])
            leg.ellipse(0, 5, 17, 12).fill(0xfffefd).stroke(outline);
    }
    else if (character === 'spiderman') {
        eyeSpacing = 18;
        r.eyes.y = 4;
        torso.poly([-29, -80, 29, -80, 37, -57, 25, -5, -25, -5, -37, -57]).fill(0x2365a0).stroke(outline)
            .poly([-28, -80, 28, -80, 20, -45, 13, -10, -13, -10, -20, -45]).fill(0xc92c3e).stroke(outline)
            .roundRect(-28, -8, 56, 29, 9).fill(0x225b94).stroke(outline);
        webPattern(torso, 0, -61, 21, 26);
        torso.ellipse(0, -52, 4, 8).ellipse(0, -42, 6, 9).fill(0x172332);
        for (const side of [-1, 1])
            for (let i = 0; i < 4; i++)
                torso.moveTo(side * 4, -50 + i * 4).lineTo(side * (11 + i), -60 + i * 8).lineTo(side * (15 + i), -65 + i * 11).stroke({ color: 0x15202a, width: 1.8 });
        face.ellipse(0, -4, 38, 49).fill(0xd52b3d).stroke(outline);
        webPattern(face, 0, 8, 36, 46);
        for (const arm of [r.leftArm, r.rightArm]) {
            const g = new Graphics().roundRect(-10, -3, 20, 35, 8).fill(0x245e9b).stroke(outline).roundRect(-11, 23, 22, 28, 7).fill(0xcd3040).stroke(outline);
            webPattern(g, 0, 35, 10, 12);
            arm.addChild(g);
        }
        for (const leg of [r.leftLeg, r.rightLeg]) {
            leg.roundRect(-11, -14, 22, 29, 7).fill(0x2365a0).stroke(outline).roundRect(-12, 5, 29, 27, 6).fill(0xca2d3d).stroke(outline);
            webPattern(leg, 0, 18, 11, 12);
        }
    }
    else {
        eyeSpacing = 18;
        r.eyes.y = 7;
        torso.roundRect(-31, -79, 62, 83, 18).fill(skin).stroke(outline)
            .poly([-31, -79, -8, -83, -9, -12, -34, -3, -37, -54]).poly([31, -79, 8, -83, 9, -12, 34, -3, 37, -54]).fill(0xd73531).stroke(outline)
            .roundRect(-33, -4, 66, 28, 6).fill(0x3569a0).stroke(outline).rect(-32, 13, 25, 11).rect(7, 13, 25, 11).fill(0xf1e2c8)
            .rect(-33, -8, 66, 11).fill(0xe9bb4d).poly([24, 0, 37, 1, 42, 34, 29, 28]).fill(0xdba63b).stroke({ color: 0x9e7230, width: 1 });
        torso.circle(-19, -49, 2.5).circle(-19, -29, 2.5).fill(0xf1bf4e);
        face.ellipse(-38, 7, 7, 12).ellipse(38, 7, 7, 12).ellipse(0, 3, 38, 43).fill(skin).stroke(outline);
        r.hair.addChild(new Graphics().poly([-39, 4, -44, -21, -35, -37, -23, -45, -10, -39, 0, -48, 14, -42, 29, -42, 42, -25, 40, 4, 31, -13, 24, 0, 15, -19, 5, -4, -4, -19, -16, -3, -24, -17, -31, 3]).fill(0x222427).stroke(outline));
        hat.addChild(new Graphics().ellipse(0, -38, 62, 13).fill(0xc99b48).stroke(outline).moveTo(-41, -39).quadraticCurveTo(-42, -78, 0, -80).quadraticCurveTo(42, -78, 41, -39).closePath().fill(0xe0bb67).stroke(outline).moveTo(-41, -47).quadraticCurveTo(0, -39, 41, -47).lineTo(40, -36).quadraticCurveTo(0, -28, -40, -36).closePath().fill(0xbc3333).stroke({ color: 0x722b2c, width: 1.4 }).ellipse(0, -32, 63, 10).fill(0xe5c477).stroke(outline));
        for (let x = -49; x <= 49; x += 9)
            (hat.children[0] as Graphics).moveTo(x, -34).lineTo(x + 4, -29).stroke({ color: 0xb08a42, width: 1 });
        face.moveTo(20, 20).lineTo(32, 20).moveTo(23, 17).lineTo(23, 23).moveTo(29, 17).lineTo(29, 23).stroke({ color: ink, width: 1.5 });
        r.mouth.moveTo(-24, 25).quadraticCurveTo(0, 33, 24, 25).quadraticCurveTo(18, 48, 0, 46).quadraticCurveTo(-18, 48, -24, 25).fill(0xfff9e8).stroke(outline).moveTo(-20, 35).quadraticCurveTo(0, 41, 20, 35).stroke({ color: ink, width: 1 });
        for (const arm of [r.leftArm, r.rightArm])
            arm.addChild(new Graphics().roundRect(-8, -3, 16, 44, 8).fill(skin).stroke(outline).roundRect(-12, 33, 24, 18, 7).fill(skin).stroke(outline).moveTo(-6, 34).lineTo(-6, 41).moveTo(1, 34).lineTo(1, 41).moveTo(7, 34).lineTo(7, 41).stroke({ color: 0x99684f, width: 1 }));
        for (const leg of [r.leftLeg, r.rightLeg])
            leg.roundRect(-9, -7, 18, 29, 6).fill(skin).stroke(outline).roundRect(-14, 14, 33, 13, 5).fill(0x997043).stroke(outline).moveTo(-8, 16).lineTo(9, 22).moveTo(12, 16).lineTo(1, 20).stroke({ color: 0x352c24, width: 3 });
    }
    if (character !== 'walle')
        for (const [i, pupil] of r.pupils.entries()) {
            const x = (i ? 1 : -1) * eyeSpacing;
            const white = new Graphics();
            if (character === 'spiderman') {
                const sign = i ? 1 : -1;
                white.poly([sign * 7, 4, sign * 32, -11, sign * 29, 9, sign * 17, 18]).fill(0xf5f7ef).stroke({ color: 0x101f31, width: 3 });
                pupil.visible = false;
            }
            else {
                white.ellipse(x, 0, character === 'olaf' ? 11 : 10, character === 'olaf' ? 14 : 12).fill(0xfffdf6).stroke({ color: ink, width: 1.3 });
                pupil.ellipse(0, 0, character === 'olaf' ? 5 : 4, character === 'olaf' ? 7 : 5).fill(ink);
                pupil.visible = true;
                pupil.x = x;
            }
            r.eyes.addChild(white, pupil);
        }
    r.lids.moveTo(-eyeSpacing - 10, 10).quadraticCurveTo(-eyeSpacing, 18, -eyeSpacing + 10, 10).moveTo(eyeSpacing - 10, 10).quadraticCurveTo(eyeSpacing, 18, eyeSpacing + 10, 10).stroke({ color: ink, width: 2.5 });
    r.hitParts = [face, torso, r.hair, r.eyes, hat, r.leftArm, r.rightArm, r.leftLeg, r.rightLeg, nose];
    return { nose, hat, lenses, eyeSpacing };
}
