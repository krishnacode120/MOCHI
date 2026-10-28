import type { Action, PetState, Settings } from '../types';
export function actionLabels(character: Settings['character'], state: PetState): [string, Action][] {
  const common: [string, Action][] = [[state === 'HIDE_SEEK' ? 'Found you!' : 'Say hello','pet'],['Give tea','tea'],['Play with Pip','play'],['Run','run'],['Climb wall','climb'],['Balloon tour','explore'],['Hide & seek','hideSeek'],['Hopscotch','hop'],['Teleport','teleport'],['Tumble down','fall'],[state === 'MOVIE' ? 'End movie time' : 'Movie time','movie'],['Work with me','work'],['Write at desk','write'],['Watch','watch'],['Stretch','stretch'],['Dance','dance'],['Blanket nap','sleep'],['Wake','wake']];
  if(character==='olaf') common.splice(1,0,['Warm hug','hug'],['Tell a story','story'],['A little wonder','wonder'],['Snow shuffle','shuffle'],['Dream of summer','summer']);
  if(character==='walle') common.splice(1,0,['Collect a plant','collect']);
  return common;
}

export const names = { mochi: 'Mochi', walle: 'WALL-E', olaf: 'Olaf' };
