import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { native, reportError } from '../../services/native';

interface Notice { id: number; kind: number; preview: boolean }
const messages = [
  { icon: '💧', title: 'A little sip?', body: 'Mochi is taking a tea break. Maybe a little water for you, too?', done: 'Had a sip' },
  { icon: '🌿', title: 'A little stretch?', body: 'Time to uncurl. Relax your shoulders and move around for a moment.', done: 'Feeling refreshed' },
  { icon: '✦', title: 'Rest those eyes.', body: 'Look away from your screen for a little while. Mochi will keep your place.', done: 'Thank you, Mochi' },
];
export function Reminder() {
  const [notice, setNotice] = useState<Notice | null>(native ? null : { id: 0, kind: 0, preview: true });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!native) return;
    let disposed = false; let unlisten = () => {};
    void (async () => {
      unlisten = await listen<Notice | null>('reminder-changed', e => { if (!disposed) { setNotice(e.payload); setBusy(false); } });
      if (disposed) { unlisten(); return; }
      const current = await invoke<Notice | null>('current_reminder');
      if (!disposed) setNotice(current);
    })().catch(reportError);
    return () => { disposed = true; unlisten(); };
  }, []);
  if (!notice) return null;
  const message = messages[notice.kind] ?? messages[0];
  const respond = async (snooze: boolean) => {
    setBusy(true);
    try {
      if (native) await invoke('respond_reminder', { id: notice.id, snooze });
      else setNotice(null);
    } catch (e) { reportError(e); setBusy(false); }
  };
  return <main className="reminder-card" role="status">
    <div className="reminder-label"><span>{message.icon}</span> A LITTLE CARE FROM MOCHI {notice.preview && <small>PREVIEW</small>}</div>
    <h1>{message.title}</h1><p>{message.body}</p>
    <div className="reminder-actions"><button className="reminder-done" disabled={busy} onClick={() => void respond(false)}>{message.done}</button><button disabled={busy} onClick={() => void respond(true)}>In 5 min</button></div>
  </main>;
}
