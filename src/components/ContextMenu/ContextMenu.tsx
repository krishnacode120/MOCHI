import { action, command, reportError } from '../../services/native';
import { usePetStore } from '../../stores/settings';
import type { Action } from '../../types';
export function ContextMenu() {
  const state = usePetStore(s => s.state);
  const entries: [string, Action][] = [['Pet Mochi', 'pet'], ['Give tea', 'tea'], ['Play with Pip', 'play'], ['A little dance', 'dance'], ['Sleep', 'sleep'], ['Wake up', 'wake'], ['Change outfit', 'outfit'], [state === 'PAUSED' ? 'Resume' : 'Pause', state === 'PAUSED' ? 'resume' : 'pause']];
  return <main className="context-menu"><div className="menu-heading">a little moment with <b>mochi</b></div>{entries.map(([label, a]) => <button key={a} onClick={() => void action(a).catch(reportError)}>{label}<span>↗</span></button>)}<hr/>{(['settings', 'hide', 'quit'] as const).map(c => <button key={c} onClick={() => void command(c).catch(reportError)}>{c === 'quit' ? 'Exit Mochi' : c === 'settings' ? 'Open settings' : 'Hide Mochi'}</button>)}</main>;
}
