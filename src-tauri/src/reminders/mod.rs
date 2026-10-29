mod clock;
use crate::{desktop, monitor, settings::Settings};
use clock::ReminderClock;
use serde::Serialize;
use std::{sync::Mutex, time::Instant};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    id: u64,
    kind: usize,
    preview: bool,
    remaining_ms: u64,
    custom_id: Option<String>,
    title: Option<String>,
    message: Option<String>,
    style: Option<String>,
}
struct Active {
    notice: Reminder,
    shown: Instant,
}
struct State {
    clock: ReminderClock,
    last: Instant,
    active: Option<Active>,
    sequence: u64,
    custom_ids: Vec<Option<String>>,
}
pub struct Reminders(Mutex<State>);
impl Default for Reminders {
    fn default() -> Self {
        Self(Mutex::new(State {
            clock: ReminderClock::default(),
            last: Instant::now(),
            active: None,
            sequence: 0,
            custom_ids: vec![None; 10],
        }))
    }
}
impl Reminders {
    pub fn current(&self) -> Option<Reminder> {
        self.0
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .active
            .as_ref()
            .map(|a| {
                let mut notice = a.notice.clone();
                notice.remaining_ms =
                    45000_u64.saturating_sub(a.shown.elapsed().as_millis() as u64);
                notice
            })
    }
    pub fn tick(&self, app: &AppHandle, settings: &Settings, eligible: bool) -> Result<(), String> {
        let mut intervals = vec![
            if settings.water_reminders {
                settings.water_interval * 60.
            } else {
                0.
            },
            if settings.stretch_reminders {
                settings.stretch_interval * 60.
            } else {
                0.
            },
            if settings.eye_reminders {
                settings.eye_interval * 60.
            } else {
                0.
            },
        ];
        let changed = {
            let mut s = self.0.lock().map_err(|e| e.to_string())?;
            // Stable slots prevent removing/reordering a reminder from transferring its timer.
            for slot in 0..10 {
                if s.custom_ids[slot]
                    .as_ref()
                    .is_some_and(|id| !settings.custom_reminders.iter().any(|r| &r.id == id))
                {
                    s.custom_ids[slot] = None;
                    s.clock.reset(slot + 3);
                }
            }
            for reminder in &settings.custom_reminders {
                if !s
                    .custom_ids
                    .iter()
                    .any(|id| id.as_ref() == Some(&reminder.id))
                {
                    if let Some(slot) = s.custom_ids.iter().position(Option::is_none) {
                        s.custom_ids[slot] = Some(reminder.id.clone());
                        s.clock.reset(slot + 3);
                    }
                }
            }
            for id in &s.custom_ids {
                intervals.push(
                    settings
                        .custom_reminders
                        .iter()
                        .find(|r| Some(&r.id) == id.as_ref() && r.enabled)
                        .map_or(0., |r| r.interval * 60.),
                );
            }
            let now = Instant::now();
            let dt = now.duration_since(s.last).as_secs_f64();
            s.last = now;
            let close = s.active.as_ref().is_some_and(|a| {
                now.duration_since(a.shown).as_secs() >= 45
                    || (!a.notice.preview
                        && (!eligible
                            || intervals.get(a.notice.kind).copied().unwrap_or(0.) == 0.
                            || (a.notice.kind >= 3
                                && s.custom_ids.get(a.notice.kind - 3).and_then(Option::as_ref)
                                    != a.notice.custom_id.as_ref())))
            });
            if close {
                s.active = None;
            }
            let available = s.active.is_none();
            let due = s.clock.tick(dt, &intervals, eligible, available);
            if let Some(kind) = due {
                let custom = s
                    .custom_ids
                    .get(kind.wrapping_sub(3))
                    .and_then(Option::as_ref)
                    .and_then(|id| settings.custom_reminders.iter().find(|r| &r.id == id));
                s.sequence += 1;
                s.active = Some(Active {
                    notice: Reminder {
                        id: s.sequence,
                        kind,
                        preview: false,
                        remaining_ms: 45000,
                        custom_id: custom.map(|r| r.id.clone()),
                        title: custom.map(|r| r.title.clone()),
                        message: custom.map(|r| r.message.clone()),
                        style: custom.map(|r| r.style.clone()),
                    },
                    shown: now,
                });
            }
            close || due.is_some()
        };
        if changed {
            self.sync_window(app)?;
        }
        Ok(())
    }
    pub fn preview(
        &self,
        app: &AppHandle,
        kind: usize,
        custom_id: Option<String>,
    ) -> Result<(), String> {
        let config = app.state::<crate::settings::Config>().snapshot();
        let custom = custom_id.as_ref().and_then(|id| {
            config
                .settings
                .custom_reminders
                .iter()
                .find(|r| &r.id == id)
        });
        if custom_id.is_some() && custom.is_none() {
            return Err("Reminder no longer exists".into());
        }
        if kind > 2 {
            return Err("Unknown reminder".into());
        }
        {
            let mut s = self.0.lock().map_err(|e| e.to_string())?;
            // A preview must not overwrite an actual reminder awaiting a response.
            if s.active.as_ref().is_some_and(|a| !a.notice.preview) {
                return Ok(());
            }
            s.sequence += 1;
            s.active = Some(Active {
                notice: Reminder {
                    id: s.sequence,
                    kind,
                    preview: true,
                    remaining_ms: 45000,
                    custom_id: custom.map(|r| r.id.clone()),
                    title: custom.map(|r| r.title.clone()),
                    message: custom.map(|r| r.message.clone()),
                    style: custom.map(|r| r.style.clone()),
                },
                shown: Instant::now(),
            });
        }
        self.sync_window(app)
    }
    pub fn respond(&self, app: &AppHandle, id: u64, snooze: bool) -> Result<(), String> {
        {
            let mut s = self.0.lock().map_err(|e| e.to_string())?;
            let Some(active) = s.active.as_ref() else {
                return Ok(());
            };
            if active.notice.id != id {
                return Ok(());
            }
            let kind = active.notice.kind;
            if !active.notice.preview {
                s.clock.respond(kind, snooze);
            }
            s.active = None;
        }
        self.sync_window(app)
    }
    fn sync_window(&self, app: &AppHandle) -> Result<(), String> {
        let handle = app.clone();
        // Read the newest card on the UI thread, so a queued expiry cannot hide
        // a newer preview or display stale content after the user dismisses it.
        app.run_on_main_thread(move || {
            if let Err(error) = handle.state::<Reminders>().refresh_window(&handle) {
                let _ = handle.emit("native-error", error);
            }
        })
        .map_err(|e| e.to_string())
    }
    fn refresh_window(&self, app: &AppHandle) -> Result<(), String> {
        // Never retain the scheduler mutex while a window call dispatches to the UI thread.
        let notice = self.current();
        let window = app
            .get_webview_window("reminder")
            .ok_or("Reminder window missing")?;
        app.emit_to("reminder", "reminder-changed", &notice)
            .map_err(|e| e.to_string())?;
        if notice.is_none() {
            return window.hide().map_err(|e| e.to_string());
        }
        let pet = desktop::pet(app)?;
        let position = pet.outer_position().map_err(|e| e.to_string())?;
        let areas = monitor::all(app)?;
        let origin = crate::settings::Position {
            x: position.x,
            y: position.y,
        };
        let area = monitor::nearest(&areas, origin);
        let size = window.outer_size().map_err(|e| e.to_string())?;
        let point = monitor::clamp(
            crate::settings::Position {
                x: origin.x,
                y: origin.y - size.height as i32 - (8. * area.scale) as i32,
            },
            size.width,
            size.height,
            area,
        );
        window
            .set_position(PhysicalPosition::new(point.x, point.y))
            .map_err(|e| e.to_string())?;
        // No set_focus: a reminder must never interrupt typing in another application.
        window.show().map_err(|e| e.to_string())
    }
}
