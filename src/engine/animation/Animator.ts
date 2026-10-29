import { updateWeatherWardrobe } from '../../characters/weather';
import { poseTargets, smooth } from './timing';
import { updateCharacter, type CharacterRig } from '../../characters/createCharacter';
import type { CursorSample, PetState, Settings } from '../../types';
export class Animator {
    pose = { jump: 0, squash: 1, wave: 0, sleep: 0, cup: 0, desk: 0 };
    private clock = 0;
    private blinkAt = 3;
    private blinkUntil = 0;
    private turn = 1;
    private grip = 0;
    private stride = 0;
    private hiding = 0;
    private floating = 0;
    private wallSide = 1;
    private ceiling = 0;
    state: PetState = 'IDLE';
    facing = 1;
    motion = { ceiling: 0, speed: 0, grip: 0, side: 1, hide: 0, float: 0, hop: 0 };
    transition(state: PetState, _reduced: boolean, _speed: number) { this.state = state; }
    update(r: CharacterRig, _time: number, dt: number, c: CursorSample, s: Settings) {
        this.clock += dt * s.speed;
        const t = this.clock, p = this.pose;
        const sleeping = this.state === 'SLEEPING';
        const gentle = s.reducedMotion || s.quiet;
        const target = poseTargets(this.state, this.actionTime, gentle);
        for (const key of Object.keys(p) as (keyof typeof p)[]) {
            const rate = key === 'sleep' ? (this.state === 'WAKING' ? 2.5 : 3.5) : 14;
            p[key] += (target[key] - p[key]) * (1 - Math.exp(-dt * s.speed * rate));
        }
        const amount = gentle ? .12 : 1;
        const blend = 1 - Math.exp(-dt * 12);
        const lerp = (a: number, b: number) => a + (b - a) * blend;
        if (t > this.blinkAt) {
            this.blinkUntil = t + .13;
            this.blinkAt = t + 3 + Math.random() * 4;
        }
        const walking = ['CEILING_CRAWLING', 'TREASURE_PATROL', 'WALKING', 'RUNNING', 'PLAYING', 'CLIMBING', 'HIDE_SEEK', 'HOPSCOTCH'].includes(this.state);
        const strideTarget = walking || Math.abs(this.motion.speed) > 3 ? Math.min(1, Math.abs(this.motion.speed) / 65) : 0;
        this.stride = lerp(this.stride, gentle ? 0 : strideTarget);
        this.ceiling = lerp(this.ceiling, gentle ? 0 : this.motion.ceiling);
        this.grip = lerp(this.grip, gentle ? 0 : this.motion.grip);
        this.hiding = lerp(this.hiding, gentle ? 0 : this.motion.hide);
        this.floating = lerp(this.floating, gentle ? 0 : this.motion.float);
        if (this.motion.grip > 0 || this.motion.hide > 0)
            this.wallSide = this.motion.side;
        const run = this.state === 'RUNNING' || this.state === 'PLAYING';
        const cycle = Math.sin(t * (run ? 13 : 8));
        if (Math.abs(this.motion.speed) > 4)
            this.facing = Math.sign(this.motion.speed);
        const facing = this.ceiling > .1 || this.grip > .1 || this.hiding > .1 || this.floating > .1 ? 1 : walking || this.stride > .1 ? this.facing : 1;
        this.turn = lerp(this.turn, facing);
        const sit = this.state === 'SITTING' || this.state === 'TYPING' || this.state === 'WRITING' ? 10 : 0;
        const stretch = this.state === 'STRETCHING' ? Math.sin(Math.PI * Math.min(1, this.actionTime / 5)) : 0;
        r.rig.x = lerp(r.rig.x, 160 + this.wallSide * (this.grip * 70 * (1-Math.min(1,this.ceiling*5)) + this.hiding * 182));
        const bounce = (r.character === 'walle' ? 0 : 1) * Math.abs(cycle) * (run ? 4 : 2) * this.stride * (1 - this.grip);
        r.rig.y = lerp(r.rig.y, 280 - this.ceiling * 195 + p.jump + p.sleep * 13 + sit - bounce - stretch * 6 * amount - this.floating * (7 + Math.sin(t * 1.8) * 3));
        const ceilingTurn=Math.PI*smooth((this.ceiling-.35)/.65);
        const lean = this.state === 'DANCING' ? Math.sin(t * 5) * .08 * amount : this.state === 'DRAGGING' ? Math.sin(t * 4) * .045 * amount : run ? -.035 * this.stride : 0;
        r.rig.rotation = lerp(r.rig.rotation, ceilingTurn + lean + Math.sin(t * 1.4) * .035 * this.floating - this.hiding * this.wallSide * .06);
        const turnScale=1-.18*Math.max(0,Math.sin(r.rig.rotation))*Math.min(1,this.ceiling*5);
        r.rig.scale.set((r.character === 'walle' ? 1 : 1 + (1 - p.squash) * .3 + p.sleep * .05) * this.turn * turnScale, p.squash * turnScale - p.sleep * .08 + Math.sin(t * (sleeping ? 1.3 : 2)) * .008 * amount);
        r.leftLeg.rotation = lerp(r.leftLeg.rotation, cycle * .48 * this.stride * (1 - this.floating) + Math.sin(t * 5) * .25 * this.grip + Math.sin(t * 2) * .12 * this.floating + this.motion.hop * .35);
        r.rightLeg.rotation = lerp(r.rightLeg.rotation, -r.leftLeg.rotation);
        r.body.scale.y = 1 - p.sleep * .35;
        r.leftLeg.alpha = r.rightLeg.alpha = 1 - p.sleep;
        let left = .15 + cycle * .35 * this.stride - p.wave * .25;
        let right = -.15 - cycle * .35 * this.stride + p.wave;
        if (this.state === 'DANCING') {
            left = .8 + Math.sin(t * 5) * .4 * amount;
            right = -left;
        }
        left = left * (1 - p.desk) + (-.65 + Math.sin(t * 16) * .12 * amount) * p.desk;
        right = right * (1 - p.desk) + (.65 - Math.sin(t * 16) * .12 * amount) * p.desk;
        left += stretch * 2.4 * amount;
        right -= stretch * 2.4 * amount;
        left = left * (1 - this.grip) + (-this.wallSide * 1.8 + Math.sin(t * 5) * .3) * this.grip;
        right = right * (1 - this.grip) + (-this.wallSide * 1.8 - Math.sin(t * 5) * .3) * this.grip;
        left = left * (1 - this.floating) - 2.8 * this.floating;
        right += Math.sin(t * 1.8) * .15 * this.floating;
        left += this.hiding * 1.8;
        right -= this.hiding * 1.8;
        left = left * (1 - p.sleep) - .8 * p.sleep;
        right = right * (1 - p.sleep) + 1.1 * p.sleep;
        r.leftArm.rotation = lerp(r.leftArm.rotation, left);
        r.rightArm.rotation = lerp(r.rightArm.rotation, right);
        const gaze = !sleeping && p.sleep < .1 && s.followCursor && p.desk < .5;
        const dx = Math.max(-1, Math.min(1, (c.localX - 160) / 180)) * facing;
        const dy = Math.max(-1, Math.min(1, (c.localY - 165) / 150));
        const watching = this.state === 'WATCHING' ? Math.sin(t * .9) * .035 * amount : 0;
        r.head.position.set(-35 * p.sleep, -119 + 54 * p.sleep);
        r.head.scale.set(1 - p.sleep * .16);
        r.head.rotation = lerp(r.head.rotation, (gaze ? dx * .055 : -p.sleep * .48) + watching);
        r.pillow.visible = r.blanket.visible = r.night.visible = p.sleep > .01;
        r.pillow.alpha = r.blanket.alpha = r.night.alpha = p.sleep;
        r.blanket.scale.y = 1 + Math.sin(t * 1.3) * (gentle ? 0 : .012) * p.sleep;
        r.moon.y = 139 + (gentle ? 0 : Math.sin(t * .6) * 2);
        r.nightStars.forEach((star, i) => { star.alpha = gentle ? .9 : .75 + .25 * Math.sin(t * 1.1 + i * 1.6); });
        const hairEase = 1 - Math.exp(-dt * 4);
        r.leftArm.scale.y = 1;
        r.hair.rotation += (Math.sin(t * 1.8) * .009 * amount - r.rig.rotation * .3 - r.hair.rotation) * hairEase;
        r.balloons.visible = this.floating > .01;
        r.balloons.alpha = this.floating;
        r.balloons.rotation = Math.sin(t * 1.2 - .6) * .022 * this.floating;
        r.eyes.scale.y = Math.max(.02, (1 - p.sleep) * (t < this.blinkUntil ? .06 : 1));
        r.eyes.visible = p.sleep < .9;
        r.lids.visible = p.sleep >= .9;
        r.pupils.forEach((eye, i) => { eye.x = lerp(eye.x, (r.character === 'walle' ? 0 : i ? r.eyeSpacing : -r.eyeSpacing) + (gaze ? dx * 3.2 : 0)); eye.y = lerp(eye.y, p.desk * 3 + (gaze ? dy * 2.5 : 0)); });
        r.yawn.visible = this.state === 'WAKING';
        r.mouth.visible = !r.yawn.visible;
        r.cup.visible = p.cup > .01;
        r.cup.alpha = p.cup;
        r.cup.y = -40 - p.cup * 38;
        r.cup.x = 14 - p.cup * 10;
        r.steam.alpha = .5 + Math.sin(t * 2) * .2;
        r.laptop.visible = p.desk > .01;
        r.laptop.alpha = p.desk;
        r.laptop.y = -8 + (1 - p.desk) * 12;
        // Decorative strokes only: never display or echo actual keyboard text.
        r.codeLines.children.forEach((line, i) => { line.scale.x = gentle ? 1 : .55 + .45 * ((Math.floor(t * 3) + i * 2) % 5) / 4; });
        updateCharacter(r, this.state, t, this.actionTime, dt, gentle, p.sleep);
        updateWeatherWardrobe(r, _time, dt, s, this.state);
        r.shadow.scale.x = 1 + p.jump / 160;
        r.shadow.alpha = .12 * (1 - Math.max(this.grip, this.floating, this.hiding));
    }
    actionTime = 0;
}
