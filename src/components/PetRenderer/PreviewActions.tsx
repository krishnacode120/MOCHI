import { action, reportError } from '../../services/native';
import { usePetStore } from '../../stores/settings';
import { actionLabels } from '../../characters/actions';
export function PreviewActions() {
  const character=usePetStore(s=>s.settings.character), state=usePetStore(s=>s.state);
  return <div className="preview-actions">{actionLabels(character,state).map(([label,a])=><button key={a} onClick={()=>void action(a).catch(reportError)}>{label}</button>)}</div>;
}
