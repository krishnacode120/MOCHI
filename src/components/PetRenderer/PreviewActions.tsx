import { action, reportError } from '../../services/native';
import type { Action } from '../../types';

export function PreviewActions() {
  return <div className="preview-actions">{(['pet', 'tea', 'play', 'dance', 'sleep', 'wake'] as Action[]).map(a => <button key={a} onClick={() => void action(a).catch(reportError)}>{a === 'pet' ? 'Say hello' : a === 'tea' ? 'Give tea' : a[0].toUpperCase() + a.slice(1)}</button>)}</div>;
}
