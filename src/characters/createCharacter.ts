import { Container, Graphics, Text } from 'pixi.js';
import { createMochi, ellipse } from './mochi/artwork';
import type { Settings, PetState } from '../types';

const ink = 0x51435f;
const line = { color: ink, width: 2.2 };
const clear = (c: Container) => c.removeChildren().forEach(child => child.destroy({ children: true }));
export function createCharacter(settings: Settings) {
  const r = createMochi(settings.outfit);
  const nose = new Container();
  const character = settings.character;
  let eyeSpacing = 25;
  if (character !== 'mochi') {
    for (const child of r.head.children) child.visible = false;
    for (const child of r.body.children) child.visible = false;
    clear(r.hair);
    for (const child of r.eyes.children) child.visible = false;
    clear(r.leftArm); clear(r.rightArm);
    r.leftLeg.clear(); r.rightLeg.clear();
    const face = new Graphics(); r.head.addChildAt(face, 0);
    const torso = new Graphics(); r.body.addChild(torso);
    if (character === 'olaf') {
      eyeSpacing = 18;
      torso.ellipse(0, -53, 39, 34).ellipse(0, 1, 56, 45).fill(0xfffcf5).stroke(line);
      torso.circle(0, -62, 5).circle(0, -41, 5).circle(0, -8, 6).fill(0x49434a);
      face.ellipse(0, 0, 45, 61).fill(0xfffcf5).stroke(line);
      r.hair.addChild(new Graphics().moveTo(-9, -55).quadraticCurveTo(-20, -76, -18, -85).moveTo(0, -59).lineTo(0, -87).moveTo(9, -55).quadraticCurveTo(18, -76, 13, -83).stroke({ color: 0x6d5039, width: 3.5, cap: 'round' }));
      nose.addChild(new Graphics().moveTo(-7, -5).quadraticCurveTo(12, -7, 40, 2).quadraticCurveTo(16, 13, -7, 7).closePath().fill(0xf49b43).stroke({ color: 0xbd693c, width: 1.7 }));
      nose.position.set(0, 28); r.head.addChild(nose);
      r.mouth.clear().moveTo(-19, 41).quadraticCurveTo(0, 65, 21, 39).quadraticCurveTo(0, 49, -19, 41).fill(0x68566a).stroke(line);
      r.mouth.roundRect(-5, 43, 12, 10, 2).fill(0xffffff);
      for (const arm of [r.leftArm, r.rightArm]) arm.addChild(new Graphics().moveTo(0, 0).lineTo(1, 40).lineTo(-10, 48).moveTo(1, 40).lineTo(3, 53).moveTo(1, 40).lineTo(13, 46).stroke({ color: 0x795840, width: 4, cap: 'round' }));
      r.leftLeg.ellipse(0, 5, 18, 15).fill(0xfffcf5).stroke(line); r.rightLeg.ellipse(0, 5, 18, 15).fill(0xfffcf5).stroke(line);
    } else {
      eyeSpacing = 28;
      torso.roundRect(-52, -72, 104, 84, 9).fill(0xd7a340).stroke(line).rect(-45, -64, 90, 14).fill(0xe9bf64).roundRect(-34, -36, 68, 36, 3).fill(0xb88738).stroke(line);
      torso.rect(-17, -103, 34, 30).fill(0x8d9195).stroke(line).circle(-40, -44, 4).circle(40, -44, 4).fill(0xede7d6).rect(-24, -27, 48, 5).fill(0x574c45);
      for (let i = 0; i < 4; i++) torso.rect(-24 + i * 13, -15, 8, 5).fill(i === 0 ? 0x84b8b8 : 0xdec477);
      face.roundRect(-65, -21, 62, 62, 16).roundRect(3, -21, 62, 62, 16).fill(0x999e9f).stroke(line).rect(-7, -1, 14, 15).fill(0x6a7177);
      r.mouth.clear(); r.yawn.clear(); r.lids.clear().moveTo(-45, 17).lineTo(-10, 17).moveTo(10, 17).lineTo(45, 17).stroke({ color: 0x4c6575, width: 4 });
      for (const arm of [r.leftArm, r.rightArm]) arm.addChild(new Graphics().roundRect(-7, 0, 14, 38, 3).fill(0x8b9495).stroke(line).rect(-12, 34, 24, 10).fill(0xa9aeb0).stroke(line).moveTo(-10, 42).lineTo(-10, 53).moveTo(10, 42).lineTo(10, 53).stroke({ color: 0x5e6368, width: 5 }));
      for (const leg of [r.leftLeg, r.rightLeg]) { leg.roundRect(-22, -14, 44, 48, 12).fill(0x53575d).stroke(line); for(let y=-5;y<29;y+=8) leg.moveTo(-17,y).lineTo(17,y).stroke({color:0x8c9194,width:3}); }
    }
    for (const [i, pupil] of r.pupils.entries()) {
      clear(pupil); pupil.clear().ellipse(0, 0, character === 'walle' ? 15 : 6, character === 'walle' ? 17 : 8).fill(character === 'walle' ? 0x23394b : 0x49434a).circle(-3, -4, 2.5).fill(0xffffff);
      pupil.visible = true; pupil.x = (i ? 1 : -1) * eyeSpacing;
      const white = ellipse(character === 'walle' ? 23 : 12, character === 'walle' ? 24 : 15, character === 'walle' ? 0xc8d4d7 : 0xffffff, false); white.x = pupil.x; r.eyes.addChildAt(white, 0);
    }
    r.hair.visible = r.eyes.visible = r.mouth.visible = true;
    r.head.addChild(r.hair, r.eyes, r.lids, r.mouth, r.yawn, nose);
    r.hitParts = [torso, face, r.hair, r.leftArm, r.rightArm, r.leftLeg, r.rightLeg, nose];
  }
  const desk = new Container(); desk.y = 8;
  desk.addChild(new Graphics().roundRect(-76, -3, 152, 12, 5).fill(0xc69f78).stroke(line).roundRect(-64, 9, 9, 30, 3).roundRect(55, 9, 9, 30, 3).fill(0xa67d5b).stroke(line));
  const notebook = new Container(); notebook.position.set(-5, 1);
  notebook.addChild(new Graphics().roundRect(-30,-15,60,20,3).fill(0xfffcf4).stroke({color:0xa99bb6,width:1.5}).moveTo(0,-13).lineTo(0,4).moveTo(-23,-8).lineTo(-6,-8).moveTo(-23,-3).lineTo(-10,-3).moveTo(7,-8).lineTo(24,-8).stroke({color:0xbaa8cb,width:1.4}));
  const pencil = new Graphics().moveTo(0,0).lineTo(19,-27).stroke({color:0xe4bb6a,width:4}).moveTo(0,0).lineTo(-2,4).stroke({color:ink,width:2}); pencil.position.set(16,-2); notebook.addChild(pencil);
  const snacks = new Container(); snacks.position.set(0,-5);
  const popcorn = new Graphics().poly([-54,-26,-18,-26,-22,10,-50,10]).fill(0xfff5df).stroke(line);
  for(let x=-48;x<-20;x+=10) popcorn.rect(x,-23,4,30).fill(0xdc8e9c);
  for(let i=0;i<9;i++) popcorn.circle(-53+(i%5)*8,-28-Math.floor(i/5)*7,6).fill(0xffe9aa).stroke({color:0xd5b46f,width:.8});
  const cola = new Graphics().poly([27,-30,53,-30,49,12,31,12]).fill(0xa473b4).stroke(line).ellipse(40,-30,14,4).fill(0xfff9e6).stroke(line).moveTo(43,-30).lineTo(47,-54).lineTo(58,-56).stroke({color:0xd9958d,width:3}).circle(40,-9,6).fill(0xffe2aa);
  snacks.addChild(popcorn,cola);
  const plant = new Container(); plant.position.set(5,-23);
  plant.addChild(new Graphics().roundRect(-17,4,34,20,4).fill(0x967855).stroke(line).moveTo(0,5).lineTo(0,-32).stroke({color:0x5c8b68,width:3}).ellipse(-10,-21,11,5).ellipse(10,-32,11,5).fill(0x96b68a).stroke({color:0x5c8b68,width:1.5}));
  r.rig.addChild(desk,notebook,snacks,plant); r.rig.addChild(r.leftArm,r.rightArm,r.blanket);
  const caption = new Container(); caption.position.set(28,10);
  caption.addChild(new Graphics().roundRect(0,0,264,44,14).fill({color:0xfffbef,alpha:.96}).stroke({color:0xd9c9e4,width:1.4}));
  const words = new Text({text:'',style:{fontFamily:'Segoe UI',fontSize:13,fill:ink,align:'center',wordWrap:true,wordWrapWidth:246}}); words.anchor.set(.5); words.position.set(132,22); caption.addChild(words); r.root.addChild(caption);
  for(const part of [desk,notebook,snacks,plant,caption]) { part.visible=false; part.alpha=0; }
  return { ...r, character, eyeSpacing, nose, desk, notebook, pencil, snacks, plant, caption, words };
}
export type CharacterRig = ReturnType<typeof createCharacter>;
const thoughts = ['Do clouds ever get tired?', 'Growing is quite an adventure.', 'A little kindness goes a long way.'];
export function updateCharacter(r: CharacterRig, state: PetState, time: number, age: number, dt: number, gentle: boolean, sleep: number) {
  const ease=1-Math.exp(-dt*9), working=state==='TYPING'||state==='WRITING';
  const show=(part:Container, target:boolean)=>{ part.alpha += ((target ? 1 : 0)-part.alpha)*ease; part.visible=part.alpha>.015; };
  show(r.desk,working); show(r.notebook,state==='WRITING'); show(r.snacks,state==='MOVIE'); show(r.plant,state==='COLLECTING');
  r.laptop.visible &&= state !== 'WRITING';
  r.pencil.rotation=gentle?0:Math.sin(time*5)*.12;
  r.leftArm.y=r.rightArm.y=working?-35:-55;
  const unfold=r.character==='olaf'&&state==='REASSEMBLING'&&!gentle?Math.sin(Math.PI*Math.min(1,age/6.5))**2:0;
  r.body.y=-12*unfold; r.head.y-=25*unfold;
  r.leftArm.x=-44-27*unfold; r.rightArm.x=44+27*unfold;
  r.nose.x=unfold*Math.sin(age*4)*27; r.nose.y=28-unfold*18;
  if(unfold>0) r.head.rotation=Math.sin(age*2)*.6*unfold;
  if(r.character==='olaf'&&['WALKING','RUNNING','PLAYING'].includes(state)&&!gentle) r.rig.rotation=Math.sin(time*6)*.065;
  if(state==='HUGGING') { const reach=gentle?.6:Math.sin(Math.PI*Math.min(1,age/5)); r.leftArm.rotation=-1.4*reach; r.rightArm.rotation=1.4*reach; }
  if(state==='STORYTELLING') { r.leftArm.rotation=gentle?.4:Math.sin(time*4)*1.1; r.rightArm.rotation=gentle?-.4:Math.cos(time*4)*1.1; r.head.rotation=gentle?0:Math.sin(time*2)*.15; }
  if(state==='SUNBATHING') {r.leftArm.rotation=.8;r.rightArm.rotation=-.8;r.eyes.scale.y=.5;}
  if(state==='MOVIE') { r.leftArm.rotation=-.5+(gentle?0:Math.sin(time*2)*.18); r.rightArm.rotation=.5; r.head.rotation=gentle?0:Math.sin(time*.65)*.035; }
  if(state==='COLLECTING') {r.leftArm.rotation=-.6;r.rightArm.rotation=.6;r.head.rotation=.1;}
  if(state==='FALLING'&&!gentle) r.rig.rotation=Math.sin(age*4)*.22*Math.sin(Math.PI*Math.min(1,age/8));
  const message = state==='HUGGING'?'A warm hug?':state==='WONDERING'?thoughts[Math.floor(age/2.4)%thoughts.length]:state==='STORYTELLING'?['And then... a grand adventure!','There was a surprise!','And everyone found a friend.'][Math.min(2,Math.floor(age/3))]:state==='REASSEMBLING'?'Oops! All here again.':state==='SUNBATHING'?'Summer looks lovely!':state==='COLLECTING'?'A little green friend.':'';
  r.words.text=message; r.caption.alpha=1; r.caption.visible=Boolean(message)&&sleep<.1;
}
