import { action, reportError } from '../../services/native';
import type { Action } from '../../types';

export function PreviewActions() {
  return <div className="preview-actions">{(['pet', 'tea', 'play', 'run', 'climb', 'explore', 'hideSeek', 'hop', 'work', 'watch', 'stretch', 'dance', 'sleep', 'wake'] as Action[]).map(a => <button key={a} onClick={() => void action(a).catch(reportError)}>{a === 'pet' ? 'Say hello' : a === 'tea' ? 'Give tea' : a === 'play' ? 'Play with Pip' : a === 'work' ? 'Work with me' : a === 'climb' ? 'Climb wall' : a === 'explore' ? 'Balloon tour' : a === 'hideSeek' ? 'Hide & seek' : a === 'hop' ? 'Hopscotch' : a[0].toUpperCase() + a.slice(1)}</button>)}</div>;
}
