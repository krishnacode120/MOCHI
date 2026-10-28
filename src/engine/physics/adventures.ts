import type { MovementBounds, PetState } from '../../types';

export const traveling = (state: PetState) => ['WALKING', 'RUNNING', 'CLIMBING', 'PLAYING', 'EXPLORING', 'HIDE_SEEK', 'HOPSCOTCH'].includes(state);
export const tripSeconds: Partial<Record<PetState, number>> = { WALKING: 7, RUNNING: 20, PLAYING: 10, CLIMBING: 24, EXPLORING: 36, HIDE_SEEK: 22, HOPSCOTCH: 12 };
export const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * ease(t);
export interface TripPose { x: number; y: number; grip: number; side: number; hide: number; float: number; hop: number }

// Pure, absolute routes: no accumulated drift, including negative monitor coordinates.
export function adventure(state: PetState, seconds: number, bounds: MovementBounds, radius: number, fullScreen = false, variant = 0): TripPose {
  const duration = tripSeconds[state] ?? 10;
  const time = Math.max(0, Math.min(duration, seconds));
  const wide = fullScreen && state !== 'WALKING' && state !== 'PLAYING';
  const left = wide ? bounds.left : Math.max(bounds.left, -radius);
  const right = wide ? bounds.right : Math.min(bounds.right, radius);
  const top = wide ? bounds.top : Math.max(bounds.top, -radius);
  const bottom = wide ? bounds.bottom : Math.min(bounds.bottom, radius);
  const side = Math.abs(bounds.left) < Math.abs(bounds.right) ? -1 : 1;
  const pose: TripPose = { x: 0, y: 0, grip: 0, side, hide: 0, float: 0, hop: 0 };
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
