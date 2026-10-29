import { traveling } from '../engine/physics/adventures';
import type { Action, PetState, Settings } from '../types';
export const names = { mochi: 'Mochi', walle: 'WALL-E', olaf: 'Olaf', spiderman: 'Spider-Man', luffy: 'Luffy' };
export const descriptions: Record<Settings['character'], string> = {
    mochi: 'Tea enthusiast. Professional daydreamer.',
    walle: 'A curious little collector with a very big heart.',
    olaf: 'Warm hugs, big questions, and dreams of summer.',
    spiderman: 'Your friendly neighborhood desktop companion.',
    luffy: 'A straw hat, a big appetite, and a bigger adventure.',
};
export const signatureActions: Record<Settings['character'], [
    string,
    Action,
    PetState
][]> = {
    mochi: [],
    walle: [['Treasure patrol', 'patrol', 'TREASURE_PATROL'], ['Protect the plant', 'collect', 'COLLECTING'], ['Compact a cube', 'compact', 'COMPACTING'], ['Inspect a treasure', 'inspect', 'INSPECTING'], ['Solar recharge', 'recharge', 'RECHARGING']],
    olaf: [['Warm hug', 'hug', 'HUGGING'], ['Tell a story', 'story', 'STORYTELLING'], ['A little wonder', 'wonder', 'WONDERING'], ['Snow shuffle', 'shuffle', 'REASSEMBLING'], ['Dream of summer', 'summer', 'SUNBATHING']],
    spiderman: [['Ceiling patrol', 'ceiling', 'CEILING_CRAWLING'], ['Shoot webs', 'web', 'WEB_SHOOTING'], ['Web swing', 'swing', 'WEB_SWINGING'], ['Spider-sense', 'sense', 'SPIDER_SENSE']],
    luffy: [['Gum-Gum rocket', 'rocket', 'GUM_ROCKET'], ['Eat meat', 'meat', 'EATING_MEAT'], ['Gum-Gum punch', 'punch', 'GUM_PUNCH'], ['Tip straw hat', 'hat', 'HAT_TIP']],
};
export function supportsState(character: Settings['character'], state: PetState) {
    const special = Object.values(signatureActions).flat();
    return !special.some(a => a[2] === state) || signatureActions[character].some(a => a[2] === state);
}
// Signature moments appear more often; travel and gentle alternatives stay character-specific.
export function idleChoices(s: Settings): PetState[] {
    const base: PetState[] = ['SITTING', 'WATCHING', 'WAVING', 'WRITING'];
    const signatures = signatureActions[s.character].map(a => a[2]);
    base.push(...signatures, ...signatures);
    if (s.character === 'mochi' || s.character === 'olaf')
        base.push('DRINKING_TEA', 'STRETCHING');
    if (!s.reducedMotion && s.adventures) {
        base.push('WALKING', 'RUNNING', 'HIDE_SEEK');
        if (s.character === 'spiderman')
            base.push('CLIMBING', 'CLIMBING', 'WEB_SWINGING');
        if (s.character === 'luffy')
            base.push('HOPSCOTCH', 'PLAYING');
        if (s.character === 'mochi' || s.character === 'olaf')
            base.push('EXPLORING', 'HOPSCOTCH', 'FALLING');
    }
    if (s.pip && s.adventures && !s.reducedMotion && s.character !== 'walle')
        base.push('PLAYING');
    return base.filter(state => !(traveling(state) && (!s.adventures || s.reducedMotion)));
}
