use crate::{
    desktop, platform,
    settings::{Config, Position},
};
use serde::Serialize;
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter, Manager};
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Sample {
    x: i32,
    y: i32,
    local_x: f64,
    local_y: f64,
    velocity: f64,
    stationary_ms: u64,
    idle_ms: u64,
    fullscreen: bool,
    battery: bool,
    visible: bool,
}
pub struct Worker {
    stop: Arc<AtomicBool>,
    handle: Mutex<Option<JoinHandle<()>>>,
}
impl Worker {
    pub fn start(app: AppHandle) -> Self {
        let stop = Arc::new(AtomicBool::new(false));
        let token = stop.clone();
        let handle = thread::spawn(move || {
            let mut previous: Option<(Position, Instant)> = None;
            let mut stationary = Instant::now();
            let mut next_environment = Instant::now();
            let mut next_recovery = Instant::now();
            let mut fullscreen = false;
            let mut battery = false;
            let mut last_error = Instant::now() - Duration::from_secs(60);
            let mut next_reminder = Instant::now();
            while !token.load(Ordering::Relaxed) {
                let now = Instant::now();
                let result = (|| -> Result<u64, String> {
                    let window = desktop::pet(&app)?;
                    let config = app.state::<Config>().snapshot();
                    let s = &config.settings;
                    let cursor = platform::cursor()?;
                    desktop::drag_tick(&app, cursor)?;
                    let idle_ms = platform::idle_ms()?;
                    if now >= next_environment {
                        next_environment = now + Duration::from_secs(2);
                        fullscreen = platform::fullscreen(&window);
                        battery = platform::battery();
                    }
                    if now >= next_recovery {
                        next_recovery = now + Duration::from_secs(3);
                        if app
                            .state::<desktop::Desktop>()
                            .drag
                            .lock()
                            .map_err(|e| e.to_string())?
                            .is_none()
                        {
                            desktop::recover(&app, false)?;
                        }
                    }
                    let velocity = previous
                        .map(|(p, t)| {
                            if p != cursor {
                                stationary = now;
                            }
                            speed(p, cursor, now.duration_since(t).as_secs_f64())
                        })
                        .unwrap_or(0.);
                    previous = Some((cursor, now));
                    let position = window.outer_position().map_err(|e| e.to_string())?;
                    let scale = window.scale_factor().map_err(|e| e.to_string())? * s.size;
                    let visible = window.is_visible().map_err(|e| e.to_string())?;
                    let sample = Sample {
                        x: cursor.x,
                        y: cursor.y,
                        local_x: (cursor.x as f64 - position.x as f64) / scale,
                        local_y: (cursor.y as f64 - position.y as f64) / scale,
                        velocity,
                        stationary_ms: now.duration_since(stationary).as_millis() as u64,
                        idle_ms,
                        fullscreen,
                        battery,
                        visible,
                    };
                    app.emit_to("pet", "cursor", sample)
                        .map_err(|e| e.to_string())?;
                    let paused = app.state::<crate::Paused>().0.load(Ordering::Relaxed);
                    if now >= next_reminder {
                        next_reminder = now + Duration::from_secs(1);
                        let resting = app.state::<crate::Resting>().0.load(Ordering::Relaxed);
                        app.state::<crate::reminders::Reminders>().tick(
                            &app,
                            s,
                            visible
                                && !paused
                                && !resting
                                && !s.quiet
                                && !fullscreen
                                && idle_ms < 300000,
                        )?;
                    }
                    Ok(
                        if paused
                            || !visible
                            || (fullscreen && s.fullscreen_pause)
                            || idle_ms > 30000
                        {
                            200
                        } else if s.battery_saver || battery {
                            80
                        } else {
                            40
                        },
                    )
                })();
                let wait = match result {
                    Ok(wait) => wait,
                    Err(e) => {
                        if now.duration_since(last_error) >= Duration::from_secs(30) {
                            let _ = app.emit("native-error", e);
                            last_error = now;
                        }
                        500
                    }
                };
                thread::sleep(Duration::from_millis(wait));
            }
        });
        Self {
            stop,
            handle: Mutex::new(Some(handle)),
        }
    }
    pub fn stop(&self) {
        self.stop.store(true, Ordering::Relaxed);
    }
    pub fn join(&self) {
        if let Some(handle) = self.handle.lock().unwrap_or_else(|e| e.into_inner()).take() {
            let _ = handle.join();
        }
    }
}
pub fn speed(a: Position, b: Position, seconds: f64) -> f64 {
    if seconds <= 0. {
        0.
    } else {
        (b.x as f64 - a.x as f64).hypot(b.y as f64 - a.y as f64) / seconds
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn physical_velocity() {
        assert_eq!(
            speed(Position { x: -10, y: 0 }, Position { x: 20, y: 40 }, 0.5),
            100.
        );
        assert_eq!(
            speed(Position { x: 0, y: 0 }, Position { x: 0, y: 0 }, 0.),
            0.
        );
    }
}
