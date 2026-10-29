import { Container, Graphics } from 'pixi.js';
import type { Settings, PetState } from '../../types';

// One resolver keeps atmospheric effects and clothing on the same active-time clock.
export function weatherMode(time: number, settings: Settings, state: PetState): Exclude<Settings['climate'], 'auto'> {
  if (settings.quiet || ['SLEEPING', 'WAKING'].includes(state)) return 'off';
  if (state === 'SUNBATHING') return 'sunny';
  const scenes = ['sunny', 'rain', 'snow', 'wind'] as const;
  return settings.climate === 'auto' ? scenes[Math.floor(Math.max(0,time)/75)%scenes.length] : settings.climate;
}
// Decorative local scenes, not live weather or location tracking.
export class Climate extends Container {
  private icon=new Graphics();
  private drops:Graphics[]=[];
  private mode='';
  constructor(){ super(); this.addChild(this.icon); for(let i=0;i<7;i++){const p=new Graphics();this.drops.push(p);this.addChild(p);} }
  update(time:number, settings:Settings, state:PetState, reduced:boolean){
    const mode=weatherMode(time,settings,state);
    this.visible=mode!=='off'&&!['SLEEPING','WAKING'].includes(state)&&!settings.quiet;
    if(!this.visible)return;
    if(mode!==this.mode){
      this.mode=mode;this.icon.clear();this.icon.position.set(259,61);
      if(mode==='sunny'){
        this.icon.circle(0,0,18).fill(0xffdfa0).stroke({color:0xd4b46f,width:1.4});
        for(let i=0;i<8;i++){const a=i*Math.PI/4;this.icon.moveTo(Math.cos(a)*23,Math.sin(a)*23).lineTo(Math.cos(a)*29,Math.sin(a)*29).stroke({color:0xe7c77f,width:2});}
      } else if(mode==='wind') this.icon.moveTo(-26,-5).bezierCurveTo(30,-9,21,-27,9,-16).moveTo(-28,5).bezierCurveTo(27,1,31,27,14,21).stroke({color:0xb1c7bc,width:3,cap:'round'});
      else this.icon.ellipse(-16,0,18,13).ellipse(4,-6,22,18).ellipse(23,3,17,11).fill(mode==='snow'?0xf3f6ff:0xb7bdcf).stroke({color:0x9096b1,width:1.3});
      this.drops.forEach((p,i)=>{p.clear();if(mode==='rain')p.moveTo(0,0).lineTo(-3,11).stroke({color:0x9ab5cf,width:2,alpha:.8});else if(mode==='snow')p.star(0,0,6,4+i%2,1.8).fill(0xf3f6ff).stroke({color:0xc0d4e5,width:1});else if(mode==='wind')p.ellipse(0,0,6,3).fill(i%2?0xe6c68f:0xa9bea4);});
    }
    this.icon.rotation=mode==='sunny'&&!reduced?Math.sin(time*.25)*.07:0;
    this.drops.forEach((p,i)=>{p.visible=mode!=='sunny';const phase=reduced?(i+1)/8:((time*(mode==='rain'?.35:.12)+i/7)%1); p.x=mode==='wind'?25+phase*270:(i%2?26:286)+(reduced?0:Math.sin(time*.7+i)*6); p.y=mode==='wind'?95+i*27:95+phase*210; p.alpha=reduced?.6:Math.sin(phase*Math.PI)*.8; p.rotation=mode==='wind'&&!reduced?Math.sin(time+i):0;});
  }
  regions(){return this.visible?[this.icon.getBounds(),...this.drops.filter(p=>p.visible&&p.alpha>.05).map(p=>p.getBounds())]:[];}
}
