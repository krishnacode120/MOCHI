import { signatureActions } from './profiles';
export { names, descriptions } from './profiles';
import type { Action, PetState, Settings } from '../types';
export function actionLabels(character: Settings['character'], state: PetState): [
    string,
    Action
][] {
    const common: [
        string,
        Action
    ][] = [[state === 'HIDE_SEEK' ? 'Found you!' : 'Say hello', 'pet'], ['Give tea', 'tea'], ['Play with Pip', 'play'], ['Run', 'run'], ['Climb wall', 'climb'], ['Balloon tour', 'explore'], ['Hide & seek', 'hideSeek'], ['Hopscotch', 'hop'], ['Teleport', 'teleport'], ['Tumble down', 'fall'], [state === 'MOVIE' ? 'End movie time' : 'Movie time', 'movie'], ['Work with me', 'work'], ['Write at desk', 'write'], ['Watch', 'watch'], ['Stretch', 'stretch'], ['Dance', 'dance'], ['Blanket nap', 'sleep'], ['Wake', 'wake']];
    common.splice(1, 0, ...signatureActions[character].map(([label, action]): [
        string,
        Action
    ] => [label, action]));
    return common.map(([label, action]) => [character === 'walle' && action === 'run' ? 'Roll around' : character === 'spiderman' && action === 'climb' ? 'Wall crawl' : label, action]);
}
