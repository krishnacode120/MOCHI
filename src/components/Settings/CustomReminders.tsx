import { useState } from 'react';
import { usePetStore } from '../../stores/settings';
import { previewReminder, saveSettings } from '../../services/native';
import type { CustomReminder } from '../../types';
const blank = () => ({ title: '', message: '', interval: 60, style: 'eyes' as CustomReminder['style'] });
export function CustomReminders() {
  const reminders = usePetStore(s => s.settings.customReminders);
  const [draft, setDraft] = useState(blank), [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  const persist = async (items: CustomReminder[]) => {
    setBusy(true);
    try {
      await saveSettings({ customReminders: items });
      return JSON.stringify(usePetStore.getState().settings.customReminders) === JSON.stringify(items);
    } finally { setBusy(false); }
  };
  const reset = () => { setOpen(false); setEditing(null); setDraft(blank()); };
  const save = async () => {
    const current = usePetStore.getState().settings.customReminders;
    if ((!editing && current.length >= 10) || (editing && !current.some(r => r.id === editing))) return;
    const item: CustomReminder = { id: editing ?? crypto.randomUUID(), title: draft.title.trim(), message: draft.message.trim(), interval: Math.round(draft.interval), enabled: editing ? current.find(r => r.id === editing)!.enabled : true, style: draft.style };
    if (await persist(editing ? current.map(r => r.id === editing ? item : r) : [...current, item])) reset();
  };
  return <section className="card custom-reminders">
    <div className="card-title"><h3>Your little reminders</h3><span>{reminders.length} / 10</span></div>
    <p className="custom-hint">A tiny nudge for anything you choose. Repeats every 5–1,440 active minutes, with the same pause and snooze rules.</p>
    {reminders.length === 0 && <p className="custom-empty">Feed the plants? Take a journal break? Make it yours. ♡</p>}
    {reminders.map(r => <div className="custom-reminder-row" key={r.id}>
      <div className="custom-reminder-copy"><strong>{r.title}</strong><p>{r.message}</p><small>Every {r.interval} active min · {r.enabled ? 'On' : 'Paused'}</small></div>
      <div className="custom-reminder-buttons">
        <button disabled={busy} aria-pressed={r.enabled} aria-label={`${r.enabled ? 'Pause' : 'Enable'} ${r.title}`} onClick={() => void persist(usePetStore.getState().settings.customReminders.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}>{r.enabled ? 'Pause' : 'Enable'}</button>
        <button disabled={busy} onClick={() => { setEditing(r.id); setDraft({ title:r.title, message:r.message, interval:r.interval, style:r.style }); setOpen(true); }}>Edit</button>
        <button disabled={busy} onClick={() => void previewReminder(0,r.id)}>Preview</button>
        <button disabled={busy} aria-label={`Remove ${r.title}`} onClick={() => { void persist(usePetStore.getState().settings.customReminders.filter(x => x.id !== r.id)).then(saved => { if (saved && editing === r.id) reset(); }); }}>Remove</button>
      </div>
    </div>)}
    {!open && <button className="custom-add" disabled={busy || reminders.length >= 10} onClick={() => { setDraft(blank()); setEditing(null); setOpen(true); }}>+ Add a reminder</button>}
    {open && <form className="custom-reminder-form" onSubmit={e => { e.preventDefault(); if (draft.title.trim()) void save(); }}>
      <h4>{editing ? 'Edit your reminder' : 'Something to remember'}</h4>
      <label>Title<input required maxLength={32} placeholder="A little plant care" value={draft.title} disabled={busy} onChange={e => setDraft({ ...draft, title:e.target.value })}/></label>
      <label>Message<textarea rows={2} maxLength={80} placeholder="Give your leafy friends a little water." value={draft.message} disabled={busy} onChange={e => setDraft({ ...draft, message:e.target.value })}/></label>
      <div className="custom-form-options"><label>Every (active minutes)<input type="number" required min={5} max={1440} step={1} value={Number.isNaN(draft.interval) ? '' : draft.interval} disabled={busy} onChange={e => setDraft({ ...draft, interval:e.target.valueAsNumber })}/></label>
      <label>Card style<select value={draft.style} disabled={busy} onChange={e => setDraft({ ...draft, style:e.target.value as CustomReminder['style'] })}><option value="eyes">Lavender star</option><option value="water">Blue teacup</option><option value="stretch">Sage stretch</option></select></label></div>
      <div className="custom-reminder-buttons"><button type="submit" disabled={busy || !draft.title.trim()}>{busy ? 'Saving…' : 'Save reminder'}</button><button type="button" disabled={busy} onClick={reset}>Cancel</button></div>
    </form>}
  </section>;
}
