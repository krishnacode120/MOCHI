import type { CharacterRig } from '../../characters/createCharacter';
import type { PetState } from '../../types';
const groundStates = new Set<PetState>(['IDLE','CURIOUS','SITTING','WALKING','RUNNING','PLAYING','TREASURE_PATROL','LANDING','WAVING','WATCHING','TYPING','WRITING','DRINKING_TEA','EATING_MEAT','COMPACTING','INSPECTING','RECHARGING','HAT_TIP']);
/** Align visible feet/hands, not the invisible padding around the pet. */
export function applyContacts(r: CharacterRig, state: PetState, floor: number, grip: number, side: number, ceiling: number) {
  const bounds = () => r.hitParts.filter(p=>p.visible && p.alpha>.01).map(p=>p.getBounds()).filter(b=>b.width>0&&b.height>0);
  const union = () => { const bs=bounds(); return {left:Math.min(...bs.map(b=>b.x)),right:Math.max(...bs.map(b=>b.x+b.width)),top:Math.min(...bs.map(b=>b.y)),bottom:Math.max(...bs.map(b=>b.y+b.height))}; };
  // Enlarged heads stay inside the canvas throughout the upside-down transition.
  if (ceiling>.01 || grip>.01) {
    let box=union();
    const fit=Math.min(1,316/(box.right-box.left),336/(box.bottom-box.top));
    if (fit<1) { r.rig.scale.x*=fit;r.rig.scale.y*=fit;box=union(); }
    r.rig.x+=Math.max(0,2-box.left)-Math.max(0,box.right-318);
    r.rig.y+=Math.max(0,2-box.top)-Math.max(0,box.bottom-338);
    if (ceiling>.1) {
      const feet=[r.leftLeg.getBounds(),r.rightLeg.getBounds(),r.body.getBounds()];
      const contact=Math.min(...feet.map(b=>b.y));
      box=union();
      r.rig.y+=Math.max(2-box.top,Math.min(338-box.bottom,(2-contact)*ceiling));
    }
    if (grip>.01 && ceiling<.1) {
      const hands=[r.leftArm.getBounds(),r.rightArm.getBounds()];
      const hand=side<0?Math.min(...hands.map(b=>b.x)):Math.max(...hands.map(b=>b.x+b.width));
      box=union();
      const shift=(side<0?2-hand:318-hand)*grip;
      r.rig.x+=Math.max(2-box.left,Math.min(318-box.right,shift));
    }
  } else if (groundStates.has(state)) {
    const feet=[r.leftLeg.getBounds(),r.rightLeg.getBounds(),r.body.getBounds()];
    const foot=Math.max(...feet.map(b=>b.y+b.height));
    // The resting footprint is fixed even while breathing or compressing on landing.
    const target=318+20*floor;
    r.rig.y+=target-foot;
    r.shadow.position.set(160,target-1);
  }
  r.shadow.visible=ceiling<.1 && grip<.1 && state!=='FALLING';
}
