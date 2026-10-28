import { describe, expect, it } from 'vitest';
import { shouldSuspend } from '../engine/behavior/sceneRules';
import { PetMachine } from '../engine/stateMachine/PetMachine';
import { Behavior } from '../engine/behavior/Behavior';
import { defaults, validateSettings } from '../stores/settings';
import { adventure } from '../engine/physics/adventures';
import type { CursorSample } from '../types';
const c:CursorSample={x:0,y:0,localX:0,localY:0,velocity:0,stationaryMs:0,idleMs:900000,fullscreen:true,battery:false,visible:true,typing:false};
describe('cozy scenes',()=>{
  it('keeps explicitly selected movie company active until ended, including fullscreen',()=>{
    const m=new PetMachine();m.request('MOVIE','user',0);m.tick(900000);new Behavior().update(900000,m,defaults,c);
    expect(m.state).toBe('MOVIE');expect(shouldSuspend(true,true,true,'MOVIE')).toBe(false);
    expect(shouldSuspend(true,true,true,'IDLE')).toBe(true);expect(shouldSuspend(false,true,true,'MOVIE')).toBe(true);
    m.request('IDLE','user',900001);expect(m.state).toBe('IDLE');
  });
  it('migrates character and weather preferences while rejecting unknown values',()=>{
    expect(validateSettings({}).character).toBe('mochi');
    expect(validateSettings({character:'olaf',climate:'snow'})).toMatchObject({character:'olaf',climate:'snow'});
    expect(validateSettings({character:'invalid' as 'olaf',climate:'invalid' as 'snow'})).toMatchObject({character:'mochi',climate:'auto'});
  });
  it('conceals teleport jumps and finishes back at home',()=>{
    const bounds={left:-800,right:400,top:-300,bottom:200};
    const before=adventure('TELEPORTING',2.99,bounds,180,true);
    const after=adventure('TELEPORTING',3,bounds,180,true);
    expect(before.vanish).toBeGreaterThan(.95);expect(after.vanish).toBe(1);expect(after.warp).toBe(true);expect(after.x).not.toBe(before.x);
    expect(adventure('TELEPORTING',12,bounds,180,true)).toMatchObject({x:0,y:0,vanish:0});
  });
});
