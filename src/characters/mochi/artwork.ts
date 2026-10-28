import { Container, Graphics } from 'pixi.js';
import { outfits } from './characterConfig';
import type { Settings } from '../../types';
const ink = 0x51435f;
export function ellipse(w: number, h: number, color: number, outline = true) {
  const g = new Graphics().ellipse(0, 0, w, h).fill(color);
  if (outline) g.stroke({ color: ink, width: 2.3 });
  return g;
}
export function createMochi(outfit: Settings['outfit']) {
  const colors = outfits[outfit];
  const root = new Container(); const rig = new Container(); root.addChild(rig); rig.position.set(160, 280);
  const shadow = ellipse(61, 9, 0x61516e, false); shadow.position.set(160, 319); shadow.alpha = .12; root.addChildAt(shadow, 0);
  const leftLeg = ellipse(17, 22, 0xfff4e5); leftLeg.position.set(-25, 15);
  const rightLeg = ellipse(17, 22, 0xfff4e5); rightLeg.position.set(25, 15);
  rig.addChild(leftLeg, rightLeg);
  const body = new Container(); rig.addChild(body);
  const hoodie = ellipse(57, 57, colors.main); hoodie.y = -25; body.addChild(hoodie);
  const pocket = new Graphics().roundRect(-26, -19, 52, 26, 12).fill(colors.light).stroke({ color: colors.dark, width: 1.5 }); body.addChild(pocket);
  const cord = new Graphics().moveTo(-13, -59).lineTo(-14, -31).moveTo(13, -59).lineTo(14, -31).stroke({ color: 0xfff4e5, width: 2.4 }); body.addChild(cord);
  const leftArm = new Container(); leftArm.position.set(-44, -55);
  const rightArm = new Container(); rightArm.position.set(44, -55);
  for (const arm of [leftArm, rightArm]) {
    const sleeve = ellipse(19, 32, colors.main); sleeve.y = 20;
    const hand = ellipse(12, 10, 0xffe7db); hand.y = 47; arm.addChild(sleeve, hand); body.addChild(arm);
  }
  leftArm.rotation = .15; rightArm.rotation = -.15;
  const head = new Container(); head.position.set(0, -119); rig.addChild(head);
  const hood = ellipse(75, 70, colors.main); hood.y = 4; head.addChild(hood);
  const earL = ellipse(21, 30, colors.main); earL.position.set(-56, -51); earL.rotation = -.4;
  const earR = ellipse(21, 30, colors.main); earR.position.set(56, -51); earR.rotation = .4;
  head.addChildAt(earL, 0); head.addChildAt(earR, 0);
  for (const x of [-56, 56]) { const e = ellipse(9, 17, colors.light, false); e.position.set(x, -54); e.rotation = x < 0 ? -.4 : .4; head.addChild(e); }
  const hairBack = ellipse(65, 61, 0xf5dfb9); hairBack.y = -3; head.addChild(hairBack);
  const face = ellipse(58, 49, 0xffe7db); face.y = 13; head.addChild(face);
  const hair = new Container(); head.addChild(hair);
  const fringe = new Graphics().moveTo(-62, 0).bezierCurveTo(-69, -70, 50, -82, 63, -4).lineTo(48, 18).quadraticCurveTo(45, -14, 25, -20).quadraticCurveTo(25, -3, 13, 8).lineTo(0, -17).quadraticCurveTo(-11, 5, -29, 10).lineTo(-24, -16).quadraticCurveTo(-46, 4, -62, 0).fill(0xfbefd9).stroke({ color: ink, width: 2.3 }); hair.addChild(fringe);
  const tuft = new Graphics().moveTo(-6, -53).quadraticCurveTo(-5, -83, 16, -72).quadraticCurveTo(3, -70, 9, -53).fill(0xfbefd9).stroke({ color: ink, width: 2 }); hair.addChild(tuft);
  const eyes = new Container(); eyes.y = 17; head.addChild(eyes);
  const pupils: Graphics[] = [];
  for (const x of [-25, 25]) {
    const white = ellipse(13, 17, 0xfffcf6, false); white.x = x; eyes.addChild(white);
    const pupil = ellipse(8.4, 13.8, 0x6d5b82, false); pupil.x = x;
    pupil.addChild(new Graphics().ellipse(0, 3, 5, 8).fill(0x9b88aa).ellipse(-2, -6, 3.2, 4).fill(0xffffff).circle(3, 5, 1.7).fill(0xffffff)); eyes.addChild(pupil); pupils.push(pupil);
    const lash = new Graphics().moveTo(x - 13, -9).quadraticCurveTo(x, -20, x + 13, -8).stroke({ color: ink, width: 3 }); eyes.addChild(lash);
  }
  const lids = new Graphics().moveTo(-37, 18).quadraticCurveTo(-25, 27, -13, 18).moveTo(13, 18).quadraticCurveTo(25, 27, 37, 18).stroke({ color: ink, width: 2.8 }); head.addChild(lids); lids.visible = false;
  const blush = new Graphics().ellipse(-39, 32, 11, 5).ellipse(39, 32, 11, 5).fill({ color: 0xeea9aa, alpha: .55 }); head.addChild(blush);
  const mouth = new Graphics().moveTo(-6, 38).quadraticCurveTo(0, 44, 6, 38).stroke({ color: ink, width: 2.2 }); head.addChild(mouth);
  const yawn = ellipse(5, 7, 0xc4868c); yawn.y = 39; head.addChild(yawn); yawn.visible = false;
  const clip = new Graphics().star(0, 0, 5, 9, 4).fill(0xf3cc83).stroke({ color: 0xc5a164, width: 1.2 }); clip.position.set(48, -12); head.addChild(clip);
  const cup = new Container(); cup.position.set(14, -40);
  cup.addChild(new Graphics().ellipse(17, -4, 9, 8).stroke({ color: ink, width: 2.5 }).roundRect(-17, -17, 33, 28, 7).fill(0xfff6e7).stroke({ color: ink, width: 2.3 }).ellipse(-1, -16, 16, 4).fill(0xb18f73).stroke({ color: ink, width: 1.6 }));
  const steam = new Graphics().moveTo(-6, -25).bezierCurveTo(-15, -35, 4, -38, -5, -48).moveTo(6, -26).quadraticCurveTo(15, -36, 7, -41).stroke({ color: 0xfff8ed, width: 2, alpha: .8 }); cup.addChild(steam); rig.addChild(cup); cup.visible = false;
  const laptop = new Container(); laptop.position.set(0, -8);
  laptop.addChild(new Graphics().roundRect(-43, -38, 86, 48, 6).fill(0xb6a5cf).stroke({ color: ink, width: 2 }).roundRect(-36, -31, 72, 32, 3).fill(0xf3eff8));
  const codeLines = new Container(); laptop.addChild(codeLines);
  for (let i = 0; i < 3; i++) { const line = new Graphics().roundRect(-29, -25 + i * 8, 26 + i * 8, 3, 1).fill(i === 1 ? 0xa2b6a0 : 0xc0aecf); codeLines.addChild(line); }
  laptop.addChild(new Graphics().roundRect(-49, 9, 98, 9, 4).fill(0xd9cbe6).stroke({ color: ink, width: 1.7 }));
  rig.addChild(laptop, leftArm, rightArm); laptop.visible = false;
  const balloons = new Container(); const balloonParts: Graphics[] = [];
  const strings = new Graphics(); balloons.addChild(strings);
  for (const [x, y, color] of [[-104, -219, 0xe9b4bf], [-74, -239, 0xc0b0df], [-43, -216, 0xf0d28f]]) {
    strings.moveTo(x, y + 24).quadraticCurveTo(x - 12, -116, -40, -54).stroke({ color: 0x8f819e, width: 1.5 });
    const balloon = ellipse(19, 25, color); balloon.position.set(x, y);
    balloon.addChild(new Graphics().ellipse(-6, -8, 4, 7).fill({ color: 0xffffff, alpha: .5 }));
    balloons.addChild(balloon); balloonParts.push(balloon);
  }
  rig.addChildAt(balloons, 0); balloons.visible = false;
  return { root, rig, shadow, body, head, hair, eyes, pupils, lids, mouth, yawn, leftArm, rightArm, leftLeg, rightLeg, cup, steam, blush, laptop, codeLines, balloons, balloonParts, strings,
    hitParts: [hoodie, hood, earL, earR, tuft, leftArm, rightArm, leftLeg, rightLeg] };
}
export type MochiRig = ReturnType<typeof createMochi>;
