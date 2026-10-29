import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { usePetStore } from '../../stores/settings';
import { native, reportError } from '../../services/native';

interface Notice { id: number; kind: number; preview: boolean; remainingMs: number; customId?: string | null; title?: string | null; message?: string | null; style?: string | null }
const messages = [
  { name: 'WATER BREAK', title: 'A sip of happy.', body: 'A little water, a little happy.', done: 'Had a sip', tone: 'water' },
  { name: 'STRETCH BREAK', title: 'Uncurl a little.', body: 'Uncurl, stretch, and breathe.', done: 'All stretched', tone: 'stretch' },
  { name: 'EYE BREAK', title: 'A softer focus.', body: 'Look far away. I’ll keep your place.', done: 'Eyes refreshed', tone: 'eyes' },
];
function CareFriend({ kind }: { kind: number }) {
  return <svg className="care-friend" viewBox="0 0 112 100" fill="none" aria-hidden="true">
    <ellipse cx="56" cy="91" rx="38" ry="5" fill="var(--care-soft)"/>
    <path d="M24 42C9 19 28 13 38 31M74 31C85 13 104 21 88 44" fill="#efd9ec" stroke="#92718f" strokeWidth="2.5"/>
    <path d="M21 60C17 30 37 25 56 25C80 25 94 38 92 61L95 77C96 90 78 93 56 92C34 93 16 88 18 77Z" fill="#fff7ee" stroke="#92718f" strokeWidth="2.5"/>
    <ellipse cx="33" cy="59" rx="7" ry="4" fill="#efbcc4"/><ellipse cx="78" cy="59" rx="7" ry="4" fill="#efbcc4"/>
    {kind === 2 ? <path d="M35 49q5 7 10 0M67 49q5 7 10 0" stroke="#705774" strokeWidth="2.5" strokeLinecap="round"/> : <g fill="#705774"><ellipse cx="40" cy="49" rx="2.5" ry="4"/><ellipse cx="72" cy="49" rx="2.5" ry="4"/></g>}
    <path d="M51 58q5 6 10 0" stroke="#705774" strokeWidth="2" strokeLinecap="round"/>
    {kind === 0 ? <g><path d="M44 68h24l-3 19H47Z" fill="#b9dee8" stroke="#6c97a5" strokeWidth="2"/><path d="M68 71c13-3 12 13-2 10M53 68l5-10h8" stroke="#6c97a5" strokeWidth="2.5" strokeLinecap="round"/><path d="M29 72q8 8 18 3M83 72q-7 8-16 3" stroke="#92718f" strokeWidth="3" strokeLinecap="round"/></g> : kind === 1 ? <g strokeLinecap="round"><path d="M29 73Q5 59 15 43M83 73q24-14 14-30" stroke="#92718f" strokeWidth="3"/><path d="M7 35l-3-6M104 35l4-6" stroke="#a4bca0" strokeWidth="3"/></g> : <g fill="#b4a1ce"><path d="M57 71l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/><path d="M96 9a10 10 0 1 0 9 15A12 12 0 0 1 96 9Z"/></g>}
    <path d="M13 14v8M9 18h8M90 4v6M87 7h6" stroke="var(--care-accent)" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
export function Reminder() {
  const [notice, setNotice] = useState<Notice | null>(native ? null : { id: 0, kind: Math.min(2, Math.max(0, Number(new URLSearchParams(location.search).get('kind')) || 0)), preview: true, remainingMs: 45000 });
  const saved = usePetStore(s => s.settings.customReminders);
  const customPreview = !native ? saved.find(r => r.id === new URLSearchParams(location.search).get('custom')) : undefined;
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(45);
  useEffect(() => {
    if (!native) return;
    let disposed = false; let changed = false; let unlisten = () => {};
    void (async () => {
      unlisten = await listen<Notice | null>('reminder-changed', e => { changed = true; if (!disposed) { setNotice(e.payload); setBusy(false); } });
      if (disposed) { unlisten(); return; }
      const current = await invoke<Notice | null>('current_reminder');
      // A late snapshot must not replace a newer event (including dismissal).
      if (!disposed && !changed) setNotice(current);
    })().catch(reportError);
    return () => { disposed = true; unlisten(); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const deadline = performance.now() + notice.remainingMs;
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [notice]);
  if (!notice) return null;
  const custom = customPreview ?? (notice.customId ? { title:notice.title, message:notice.message, style:notice.style } : null);
  const styleIndex = custom ? Math.max(0, ['water','stretch','eyes'].indexOf(custom.style ?? 'eyes')) : notice.kind;
  const base = messages[styleIndex] ?? messages[0];
  const message = custom ? { ...base, name: 'JUST FOR YOU', title: custom.title || 'A little reminder', body:custom.message || 'A little nudge from Mochi. ♡', done:'Done' } : base;
  const respond = async (snooze: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (native) await invoke('respond_reminder', { id: notice.id, snooze });
      else setNotice(null);
    } catch (e) { reportError(e); setBusy(false); }
  };
  return <main className="reminder-card" data-care={message.tone} aria-labelledby="care-title">
    <div className="reminder-label"><span className="care-dot"/> MOCHI CARE <small>{notice.preview ? 'PREVIEW' : message.name}</small></div>
    <div className="care-heading"><div><h1 id="care-title">{message.title}</h1></div><CareFriend kind={styleIndex}/></div>
    <p className="care-message" tabIndex={0}>{message.body}</p>
    <div className="reminder-actions"><button className="reminder-done" disabled={busy} onClick={() => void respond(false)}>{notice.preview ? 'Close preview' : message.done} <span aria-hidden="true">♡</span></button>{!notice.preview && <button disabled={busy} onClick={() => void respond(true)}>Snooze 5 min</button>}</div>
    <div className="care-footer"><span>{notice.preview ? 'Preview · timer unchanged' : '5 active min snooze'}</span><span aria-live="off">Closes in {remaining}s</span></div>
    <div className="care-time-track" aria-hidden="true"><i style={{ transform: `scaleX(${remaining / 45})` }}/></div>
  </main>;
}
