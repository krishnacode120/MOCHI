import type { MovementBounds, PetState } from '../../types';

export const traveling = (state: PetState) => ['CEILING_CRAWLING', 'TREASURE_PATROL', 'GUM_ROCKET', 'WEB_SWINGING', 'WALKING', 'RUNNING', 'CLIMBING', 'PLAYING', 'EXPLORING', 'HIDE_SEEK', 'HOPSCOTCH', 'TELEPORTING', 'FALLING'].includes(state);
export const tripSeconds: Partial<Record<PetState, number>> = { CEILING_CRAWLING: 32, TREASURE_PATROL: 24, GUM_ROCKET: 18, WEB_SWINGING: 24, TELEPORTING: 12, FALLING: 8, WALKING: 7, RUNNING: 20, PLAYING: 18, CLIMBING: 24, EXPLORING: 36, HIDE_SEEK: 22, HOPSCOTCH: 12 };
export const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * ease(t);
export interface TripPose { ceiling: number; x: number; y: number; grip: number; side: number; hide: number; float: number; hop: number; vanish: number; warp: boolean }

// Pure, absolute routes: no accumulated drift, including negative monitor coordinates.
export function adventure(state: PetState, seconds: number, bounds: MovementBounds, radius: number, fullScreen = false, variant = 0): TripPose {
  const duration = tripSeconds[state] ?? 10;
  const time = Math.max(0, Math.min(duration, seconds));
  const wide = fullScreen && state !== 'WALKING';
  const left = wide ? bounds.left : Math.max(bounds.left, -radius);
  const right = wide ? bounds.right : Math.min(bounds.right, radius);
  const top = wide ? bounds.top : Math.max(bounds.top, -radius);
  const bottom = wide ? bounds.bottom : Math.min(bounds.bottom, radius);
  const side = Math.abs(bounds.left) < Math.abs(bounds.right) ? -1 : 1;
  const pose: TripPose = { x: 0, y: 0, ceiling: 0, grip: 0, side, hide: 0, float: 0, hop: 0, vanish: 0, warp: false };
  if (state === 'WEB_SWINGING' || state === 'GUM_ROCKET') {
    const stops = variant < .5 ? [[0,0],[left,bottom],[right,bottom],[0,0]] : [[0,0],[right,bottom],[left,bottom],[0,0]];
    const phase = time / duration * 3, part = Math.min(2, Math.floor(phase)), u = phase - part;
    const arc = Math.sin(Math.PI * u) ** 2;
    pose.x = mix(stops[part][0], stops[part+1][0], u);
    pose.y = mix(stops[part][1], stops[part+1][1], u) * (1-arc) + top * arc;
    pose.hop = state === 'GUM_ROCKET' ? arc : 0;
    return pose;
  }
  if (state === 'CEILING_CRAWLING') {
    const wall = side < 0 ? bounds.left : bounds.right, other = side < 0 ? bounds.right : bounds.left;
    pose.x = time < 5 ? mix(0,wall,time/5) : time < 11 ? wall : time < 21 ? mix(wall,other,(time-11)/10) : time < 27 ? other : mix(other,0,(time-27)/5);
    pose.y = time < 5 ? 0 : time < 11 ? mix(0,top,(time-5)/6) : time < 21 ? top : time < 27 ? mix(top,bottom,(time-21)/6) : mix(bottom,0,(time-27)/5);
    pose.ceiling = ease((time-10)/1) * (1-ease((time-21)/1));
    pose.side = time < 21 ? side : -side;
    pose.grip = ease((time-4.5)/.5) * (1-ease((time-26.5)/.5)) * (1-pose.ceiling);
    return pose;
  }
  if (state === 'TREASURE_PATROL') {
    const first=variant<.5?left:right, second=variant<.5?right:left;
    const stops = [[0,0,0],[3,0,bottom],[7,first,bottom],[9,first,bottom],[15,second,bottom],[17,second,bottom],[21,0,bottom],[24,0,0]];
    const part = Math.min(stops.length-2, Math.max(0, stops.findIndex((_p,i)=>i<stops.length-1 && time<=stops[i+1][0])));
    const from=stops[part], to=stops[part+1], u=(time-from[0])/(to[0]-from[0]);
    pose.x=mix(from[1],to[1],u);pose.y=mix(from[2],to[2],u);
    return pose;
  }
  if (state === 'TELEPORTING') {
    const stops = [[0,0],[left+(right-left)*(.15+variant*.2),top+(bottom-top)*.25],[left+(right-left)*.8,top+(bottom-top)*.75],[0,0]];
    const index=Math.min(3,Math.floor(time/3));
    [pose.x,pose.y]=stops[index]; pose.warp=true;
    pose.vanish=Math.max(...[3,6,9].map(at=>Math.max(0,1-Math.abs(time-at)/.45)));
    return pose;
  }
  if (state === 'FALLING') {
    const floor=bottom, lift=Math.max(top,-100);
    pose.y=time<1.5?mix(0,lift,time/1.5):time<3?lift+(floor-lift)*Math.min(1,((time-1.5)/1.5)**2):time<4.5?floor-Math.min(45,floor-top)*Math.abs(Math.sin((time-3)/1.5*Math.PI)):mix(floor,0,(time-4.5)/3.5);
    return pose;
  }
  if (state === 'CLIMBING') {
    const wall = side < 0 ? bounds.left : bounds.right;
    pose.x = time < 5 ? mix(0, wall, time / 5) : time < 19 ? wall : mix(wall, 0, (time - 19) / 5);
    pose.y = time < 6 ? 0 : time < 12 ? mix(0, top, (time - 6) / 6) : time < 13 ? top : mix(top, 0, (time - 13) / 6);
    pose.grip = ease((time - 5) / .7) * (1 - ease((time - 18.3) / .7));
    return pose;
  }
  if (state === 'HIDE_SEEK') {
    const wall = side < 0 ? bounds.left : bounds.right;
    pose.x = time < 5 ? mix(0, wall, time / 5) : time < 17 ? wall : mix(wall, 0, (time - 17) / 5);
    // Two readable peeks, followed by an automatic reveal even if never found.
    const peek = .5 + .5 * Math.cos((time - 7) * Math.PI / 2.5);
    pose.hide = ease((time - 5) / 1.2) * (1 - ease((time - 15.5) / 1.5)) * (.83 + .17 * peek);
    return pose;
  }
  if (state === 'EXPLORING') {
    const stops = variant < .5 ? [[0, 0], [left, bottom], [left, top], [right, top], [right, bottom], [0, 0]] : [[0, 0], [right, bottom], [right, top], [left, top], [left, bottom], [0, 0]];
    const phase = Math.max(0, Math.min(1, (time - 1) / 33)) * 5;
    const part = Math.min(4, Math.floor(phase)), u = phase - part;
    pose.x = mix(stops[part][0], stops[part + 1][0], u);
    // Different, eased x/y progress makes a gentle arc without leaving the bounds.
    pose.y = mix(stops[part][1], stops[part + 1][1], ease(u));
    pose.float = ease(time / 1.2) * (1 - ease((time - 34) / 2));
    return pose;
  }
  const routeDuration = duration - 1;
  const phase = Math.max(0, Math.min(1, (time - .5) / routeDuration)) * 4;
  const stops = variant < .5 ? [0, left, 0, right, 0] : [0, right, 0, left, 0];
  const part = Math.min(3, Math.floor(phase));
  pose.x = mix(stops[part], stops[part + 1], phase - part);
  if (state === 'HOPSCOTCH') {
    const progress = Math.max(0, Math.min(1, (time - .5) / 11));
    pose.hop = Math.abs(Math.sin(progress * Math.PI * 6));
    pose.y = Math.max(bounds.top, -42) * pose.hop;
  } else if (state === 'PLAYING' || state === 'RUNNING') {
    pose.y = Math.max(bounds.top, -18) * Math.sin(Math.PI * time / duration) ** 2;
  }
  return pose;
}
