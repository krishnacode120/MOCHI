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
}
pub struct Reminders(Mutex<State>);
impl Default for Reminders {
    fn default() -> Self {
        Self(Mutex::new(State {
            clock: ReminderClock::default(),
            last: Instant::now(),
            active: None,
            sequence: 0,
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
        let intervals = [
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
            let now = Instant::now();
            let dt = now.duration_since(s.last).as_secs_f64();
            s.last = now;
            let close = s.active.as_ref().is_some_and(|a| {
                now.duration_since(a.shown).as_secs() >= 45
                    || (!a.notice.preview && (!eligible || intervals[a.notice.kind] == 0.))
            });
            if close {
                s.active = None;
            }
            let available = s.active.is_none();
            let due = s.clock.tick(dt, intervals, eligible, available);
            if let Some(kind) = due {
                s.sequence += 1;
                s.active = Some(Active {
                    notice: Reminder {
                        id: s.sequence,
                        kind,
                        preview: false,
                        remaining_ms: 45000,
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
    pub fn preview(&self, app: &AppHandle, kind: usize) -> Result<(), String> {
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
