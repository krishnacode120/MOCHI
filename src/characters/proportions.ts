import type { Settings } from '../types';
// Character-specific anatomy, kept separate from pose timing and desktop coordinates.
export const proportions: Record<Settings['character'], { head: number; headY: number; torso: number; leg: number }> = {
  mochi: { head:1.06, headY:-106, torso:.9, leg:.82 },
  walle: { head:1.12, headY:-112, torso:1, leg:1 },
  olaf: { head:1.08, headY:-112, torso:.94, leg:.9 },
  spiderman: { head:1.34, headY:-102, torso:.83, leg:.78 },
  luffy: { head:1.38, headY:-103, torso:.82, leg:.78 },
};
