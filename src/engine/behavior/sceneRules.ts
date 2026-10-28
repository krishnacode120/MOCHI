import type { PetState } from '../../types';
export const shouldSuspend = (visible: boolean, fullscreen: boolean, pauseFullscreen: boolean, state: PetState) => !visible || (fullscreen && pauseFullscreen && state !== 'MOVIE');
