import { Container, Graphics } from 'pixi.js';
import type { MochiRig } from './mochi/artwork';
import type { Settings, PetState } from '../types';
import { weatherMode } from '../engine/particles/Climate';
const line = { color: 0x655270, width: 2, join: 'round' as const };
export function createWeatherWardrobe(r: MochiRig, character: Settings['character']) {
    const umbrella = new Container();
    const shade = character === 'spiderman' ? 0xcc5965 : character === 'luffy' ? 0xe9bd63 : character === 'walle' ? 0xe6b95c : 0xb5a2d6;
    umbrella.addChild(new Graphics().moveTo(58, -216).lineTo(58, -45).quadraticCurveTo(58, -31, 46, -37).stroke({ color: 0x897b95, width: 3, cap: 'round' }));
    umbrella.addChild(new Graphics().moveTo(-80, -216).quadraticCurveTo(0, -302, 80, -216).quadraticCurveTo(58, -230, 40, -216).quadraticCurveTo(20, -230, 0, -216).quadraticCurveTo(-20, -230, -40, -216).quadraticCurveTo(-60, -230, -80, -216).fill(shade).stroke(line)
        .moveTo(0, -259).quadraticCurveTo(-27, -247, -40, -216).moveTo(0, -259).lineTo(0, -216).moveTo(0, -259).quadraticCurveTo(27, -247, 40, -216).stroke({ color: 0xfff4df, width: 1.5, alpha: .7 }));
    const sunglasses = new Container();
    const spacing = character === 'walle' ? 31 : character === 'olaf' ? 16 : character === 'mochi' ? 25 : 18;
    const lensWidth = character === 'walle' ? 44 : character === 'mochi' ? 34 : 29;
    sunglasses.y = character === 'mochi' ? 10 : character === 'walle' ? 3 : character === 'olaf' ? 1 : 10;
    const glasses = new Graphics();
    for (const x of [-spacing, spacing]) {
        glasses.roundRect(x-lensWidth/2, -11, lensWidth, 24, 7).fill(0x33344c).stroke({color:0x6c6087,width:2})
            .moveTo(x-8,-5).lineTo(x+1,-5).stroke({color:0xb5dbe4,width:3,cap:'round'});
    }
    glasses.moveTo(-spacing+lensWidth/2, -3).quadraticCurveTo(0,-9,spacing-lensWidth/2,-3).stroke(line);
    sunglasses.addChild(glasses);
    const scarf = new Container();
    scarf.y = character === 'walle' ? -91 : character === 'olaf' ? -76 : -72;
    const width = character === 'mochi' ? 44 : character === 'walle' ? 25 : 30;
    const tail = new Graphics().roundRect(-9, 0, 18, 43, 5).fill(0xc3768e).stroke(line).rect(-8,13,16,5).rect(-8,27,16,5).fill(0xffdfb0);
    tail.position.set(width-6, 8);
    scarf.addChild(tail, new Graphics().roundRect(-width,-5,width*2,19,7).fill(0xd990a5).stroke(line).moveTo(-width+8,0).lineTo(width-8,0).stroke({color:0xffdfb0,width:3}));
    r.rig.addChild(umbrella, scarf); r.head.addChild(sunglasses);
    const weatherProps = [umbrella, sunglasses, scarf];
    weatherProps.forEach(p=>{p.visible=false;p.alpha=0;});
    return { umbrella, sunglasses, scarf, scarfTail: tail, weatherProps };
}
// Accessories are stowed for acrobatics and sleep so they cannot clip or obstruct signature gestures.
const unsafe = new Set<PetState>(['CEILING_CRAWLING','CLIMBING','HIDE_SEEK','EXPLORING','FALLING','GUM_ROCKET','WEB_SWINGING','TELEPORTING','DRAGGING','LANDING','SLEEPING','WAKING','REASSEMBLING']);
export function updateWeatherWardrobe(r: MochiRig & ReturnType<typeof createWeatherWardrobe> & { character: Settings['character']; hat: Container }, time: number, dt: number, s: Settings, state: PetState) {
    const mode = weatherMode(time, s, state);
    if (unsafe.has(state) || mode === 'off') { r.weatherProps.forEach(p=>{p.visible=false;p.alpha=0;}); return; }
    const calm = ['IDLE','CALM','SITTING','WATCHING','WALKING','RUNNING','TREASURE_PATROL','SUNBATHING'].includes(state);
    const targets = [mode === 'rain' && calm, mode === 'sunny', mode === 'snow' || mode === 'wind'];
    const blend = 1-Math.exp(-dt*10);
    r.weatherProps.forEach((p,i)=>{p.alpha += ((targets[i]?1:0)-p.alpha)*blend;p.visible=p.alpha>.015;});
    const gentle = s.reducedMotion || s.batterySaver;
    r.umbrella.rotation = gentle ? 0 : Math.sin(time*1.2)*.015;
    r.scarfTail.rotation = gentle ? 0 : mode === 'wind' ? -.45+Math.sin(time*5)*.16 : Math.sin(time*2)*.05;
    if (mode === 'rain' && calm) { r.rightArm.rotation += (-.42-r.rightArm.rotation)*r.umbrella.alpha; }
    if (mode === 'snow' && calm && !gentle) {
        // Olaf enjoys snow; the others give a small, occasional chilly shiver.
        r.head.rotation += r.character === 'olaf' ? Math.sin(time*1.4)*.035 : Math.sin(time*24)*.018*Math.max(0,Math.sin(time*.7))**8;
    }
    if (mode === 'wind' && calm && r.character === 'luffy') {
        r.rightArm.rotation += (-2.5-r.rightArm.rotation)*r.scarf.alpha;
        r.hat.rotation = gentle ? 0 : Math.sin(time*3)*.025;
    }
}
