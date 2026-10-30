use crate::{
    monitor, platform,
    settings::{Config, Position},
};
use serde::{Deserialize, Serialize};
use std::{sync::Mutex, time::Instant};
use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, WebviewWindow};
#[derive(Debug, Clone, Deserialize)]
pub struct HitEllipse {
    #[serde(default)]
    pub rectangular: bool,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}
#[derive(Clone, Copy)]
pub struct Drag {
    pub cursor: Position,
    pub window: Position,
    pub last_cursor: Position,
    pub last_tick: Instant,
    pub last_move: Instant,
    pub vx: f64,
    pub vy: f64,
}
pub struct Fall {
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    last: Instant,
}
#[derive(Default)]
pub struct Desktop {
    pub drag: Mutex<Option<Drag>>,
    pub home: Mutex<Option<Position>>,
    pub fall: Mutex<Option<Fall>>,
}
pub fn pet(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("pet")
        .ok_or("Pet window missing".into())
}
pub fn apply(app: &AppHandle) -> Result<(), String> {
    let s = app.state::<Config>().snapshot().settings;
    let pet = pet(app)?;
    pet.set_always_on_top(s.always_on_top)
        .map_err(|e| e.to_string())?;
    pet.set_ignore_cursor_events(s.click_through || !s.interactions)
        .map_err(|e| e.to_string())?;
    pet.set_size(LogicalSize::new(320. * s.size, 340. * s.size))
        .map_err(|e| e.to_string())?;
    recover(app, false)
}
pub fn recover(app: &AppHandle, reset: bool) -> Result<(), String> {
    if reset {
        cancel_fall(app)?;
    }
    let config = app.state::<Config>();
    let data = config.snapshot();
    let areas = monitor::all(app)?;
    let pet = pet(app)?;
    let current = pet.outer_position().map_err(|e| e.to_string())?;
    let preferred = &areas[data.settings.monitor.min(areas.len() - 1)];
    let p = if reset {
        monitor::corner(preferred, data.settings.size)
    } else {
        Position {
            x: current.x,
            y: current.y,
        }
    };
    let area = if reset {
        preferred
    } else {
        monitor::nearest(&areas, p)
    };
    let p = monitor::clamp(
        p,
        (320. * data.settings.size * area.scale) as u32,
        (340. * data.settings.size * area.scale) as u32,
        area,
    );
    if p.x != current.x || p.y != current.y || reset {
        pet.set_position(PhysicalPosition::new(p.x, p.y))
            .map_err(|e| e.to_string())?;
        *app.state::<Desktop>()
            .home
            .lock()
            .map_err(|e| e.to_string())? = None;
        app.emit_to("pet", "position-reset", ())
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
pub fn restore(app: &AppHandle) -> Result<(), String> {
    let data = app.state::<Config>().snapshot();
    if let Some(p) = data.position {
        pet(app)?
            .set_position(PhysicalPosition::new(p.x, p.y))
            .map_err(|e| e.to_string())?;
        apply(app)?;
    } else {
        apply(app)?;
        recover(app, true)?;
    }
    Ok(())
}
pub fn persist_position(app: &AppHandle) -> Result<(), String> {
    let pet = pet(app)?;
    let mut p = pet.outer_position().map_err(|e| e.to_string())?;
    let config = app.state::<Config>();
    let s = config.snapshot().settings;
    let areas = monitor::all(app)?;
    let area = monitor::nearest(&areas, Position { x: p.x, y: p.y });
    let size = pet.outer_size().map_err(|e| e.to_string())?;
    if s.snap_edges {
        let edge_x = area.x + area.width.saturating_sub(size.width) as i32;
        let edge_y = area.y + area.height.saturating_sub(size.height) as i32;
        let threshold = (18. * area.scale) as i32;
        if (p.x - area.x).abs() < threshold {
            p.x = area.x;
        } else if (p.x - edge_x).abs() < threshold {
            p.x = edge_x;
        }
        if (p.y - area.y).abs() < threshold {
            p.y = area.y;
        } else if (p.y - edge_y).abs() < threshold {
            p.y = edge_y;
        }
    }
    let pos = monitor::clamp(Position { x: p.x, y: p.y }, size.width, size.height, area);
    pet.set_position(PhysicalPosition::new(pos.x, pos.y))
        .map_err(|e| e.to_string())?;
    config.data.lock().map_err(|e| e.to_string())?.position = Some(pos);
    config.write()
}
pub fn start_drag(app: &AppHandle) -> Result<(), String> {
    let s = app.state::<Config>().snapshot().settings;
    if s.click_through || !s.interactions {
        return Err("Mouse interaction is disabled".into());
    }
    cancel_fall(app)?;
    let p = pet(app)?.outer_position().map_err(|e| e.to_string())?;
    let cursor = platform::cursor()?;
    *app.state::<Desktop>()
        .home
        .lock()
        .map_err(|e| e.to_string())? = None;
    *app.state::<Desktop>()
        .drag
        .lock()
        .map_err(|e| e.to_string())? = Some(Drag {
        cursor,
        window: Position { x: p.x, y: p.y },
        last_cursor: cursor,
        last_tick: Instant::now(),
        last_move: Instant::now(),
        vx: 0.,
        vy: 0.,
    });
    Ok(())
}
pub fn finish_drag(app: &AppHandle) -> Result<(), String> {
    let drag = app
        .state::<Desktop>()
        .drag
        .lock()
        .map_err(|e| e.to_string())?
        .take();
    if let Some(drag) = drag {
        let _ = app.emit_to("pet", "drag-ended", ());
        let fresh = drag.last_move.elapsed().as_millis() < 150;
        start_fall(
            app,
            if fresh { drag.vx } else { 0. },
            if fresh { drag.vy } else { 0. },
        )?;
    }
    Ok(())
}
pub fn cancel_fall(app: &AppHandle) -> Result<(), String> {
    app.state::<Desktop>()
        .fall
        .lock()
        .map_err(|e| e.to_string())?
        .take();
    Ok(())
}
pub fn start_fall(app: &AppHandle, vx: f64, vy: f64) -> Result<(), String> {
    let desktop = app.state::<Desktop>();
    if desktop.drag.lock().map_err(|e| e.to_string())?.is_some() {
        return Ok(());
    }
    let settings = app.state::<Config>().snapshot().settings;
    let window = pet(app)?;
    let p = window.outer_position().map_err(|e| e.to_string())?;
    let areas = monitor::all(app)?;
    let area = monitor::nearest(&areas, Position { x: p.x, y: p.y });
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let p = monitor::clamp(Position { x: p.x, y: p.y }, size.width, size.height, area);
    window
        .set_position(PhysicalPosition::new(p.x, p.y))
        .map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())? * settings.size;
    *desktop.home.lock().map_err(|e| e.to_string())? = None;
    cancel_fall(app)?;
    if settings.reduced_motion || settings.quiet {
        let _ = app.emit_to("pet", "fall-motion", "landed");
        return persist_position(app);
    }
    *desktop.fall.lock().map_err(|e| e.to_string())? = Some(Fall {
        x: p.x as f64,
        y: p.y as f64,
        vx: vx.clamp(-800. * scale, 800. * scale),
        vy: vy.clamp(-850. * scale, 850. * scale),
        last: Instant::now(),
    });
    app.emit_to("pet", "fall-motion", "falling")
        .map_err(|e| e.to_string())
}
pub fn drag_tick(app: &AppHandle, cursor: Position, can_fall: bool) -> Result<(), String> {
    let desktop = app.state::<Desktop>();
    let mut drag_guard = desktop.drag.lock().map_err(|e| e.to_string())?;
    if let Some(drag) = drag_guard.as_mut() {
        if !platform::left_down() {
            drop(drag_guard);
            return finish_drag(app);
        }
        let now = Instant::now();
        let dt = now.duration_since(drag.last_tick).as_secs_f64().max(0.001);
        if cursor != drag.last_cursor {
            let blend = 1. - (-dt * 20.).exp();
            drag.vx += (((cursor.x - drag.last_cursor.x) as f64 / dt) - drag.vx) * blend;
            drag.vy += (((cursor.y - drag.last_cursor.y) as f64 / dt) - drag.vy) * blend;
            drag.last_move = now;
        }
        drag.last_cursor = cursor;
        drag.last_tick = now;
        let x = drag.window.x + cursor.x - drag.cursor.x;
        let y = drag.window.y + cursor.y - drag.cursor.y;
        drop(drag_guard);
        return pet(app)?
            .set_position(PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string());
    }
    drop(drag_guard);
    if desktop.fall.lock().map_err(|e| e.to_string())?.is_none() {
        return Ok(());
    }
    // Window queries may dispatch to the UI thread. Do not hold the motion mutex during them.
    let settings = app.state::<Config>().snapshot().settings;
    let window = pet(app)?;
    let position = window.outer_position().map_err(|e| e.to_string())?;
    let areas = monitor::all(app)?;
    let area = monitor::nearest(
        &areas,
        Position {
            x: position.x,
            y: position.y,
        },
    );
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())? * settings.size;
    let mut fall_guard = desktop.fall.lock().map_err(|e| e.to_string())?;
    let Some(fall) = fall_guard.as_mut() else {
        return Ok(());
    };
    let now = Instant::now();
    let gap = now.duration_since(fall.last).as_secs_f64();
    let dt = if gap > 0.5 { 0. } else { gap.min(0.1) };
    fall.last = now;
    if !can_fall {
        return Ok(());
    }
    if settings.reduced_motion || settings.quiet {
        *fall_guard = None;
        drop(fall_guard);
        persist_position(app)?;
        return app
            .emit_to("pet", "fall-motion", "landed")
            .map_err(|e| e.to_string());
    }
    let left = area.x as f64;
    let right = left + area.width.saturating_sub(size.width) as f64;
    let top = area.y as f64;
    let floor = top + area.height.saturating_sub(size.height) as f64;
    // Gravity is measured in logical pixels/second, independent of rendering FPS and animation speed.
    fall.x += fall.vx * dt;
    fall.y += fall.vy * dt + 0.5 * 1500. * scale * dt * dt;
    fall.vy = (fall.vy + 1500. * scale * dt).min(1200. * scale);
    fall.vx *= (-dt * 0.55).exp();
    if fall.x < left || fall.x > right {
        fall.x = fall.x.clamp(left, right);
        fall.vx *= -0.22;
    }
    if fall.y < top {
        fall.y = top;
        fall.vy = fall.vy.abs() * 0.2;
    }
    let landed = fall.y >= floor;
    if landed {
        fall.y = floor;
    }
    let position = PhysicalPosition::new(fall.x.round() as i32, fall.y.round() as i32);
    if landed {
        *fall_guard = None;
    }
    drop(fall_guard);
    window.set_position(position).map_err(|e| e.to_string())?;
    if landed {
        persist_position(app)?;
        app.emit_to("pet", "fall-motion", "landed")
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[derive(Serialize)]
pub struct MovementBounds {
    left: f64,
    right: f64,
    top: f64,
    bottom: f64,
}
pub fn movement_bounds(app: &AppHandle) -> Result<MovementBounds, String> {
    let window = pet(app)?;
    let p = window.outer_position().map_err(|e| e.to_string())?;
    let base = app
        .state::<Desktop>()
        .home
        .lock()
        .map_err(|e| e.to_string())?
        .unwrap_or(Position { x: p.x, y: p.y });
    let areas = monitor::all(app)?;
    let area = monitor::nearest(&areas, base);
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?
        * app.state::<Config>().snapshot().settings.size;
    Ok(MovementBounds {
        left: (area.x - base.x) as f64 / scale,
        right: (area.x + area.width.saturating_sub(size.width) as i32 - base.x) as f64 / scale,
        top: (area.y - base.y) as f64 / scale,
        bottom: (area.y + area.height.saturating_sub(size.height) as i32 - base.y) as f64 / scale,
    })
}
pub fn move_relative(
    app: &AppHandle,
    dx: f64,
    dy: f64,
    returning: bool,
    wall: bool,
) -> Result<(), String> {
    if !dx.is_finite() || !dy.is_finite() {
        return Err("Invalid movement".into());
    }
    let s = app.state::<Config>().snapshot().settings;
    let desktop = app.state::<Desktop>();
    if desktop.drag.lock().map_err(|e| e.to_string())?.is_some()
        || desktop.fall.lock().map_err(|e| e.to_string())?.is_some()
    {
        return Ok(());
    }
    let window = pet(app)?;
    let p = window.outer_position().map_err(|e| e.to_string())?;
    let mut home = desktop.home.lock().map_err(|e| e.to_string())?;
    let base = *home.get_or_insert(Position { x: p.x, y: p.y });
    let areas = monitor::all(app)?;
    let area = monitor::nearest(&areas, base);
    let scale = window.scale_factor().map_err(|e| e.to_string())? * s.size;
    let dest = Position {
        x: base.x
            + (dx.clamp(
                if wall {
                    -(area.width as f64) / scale
                } else {
                    -s.play_radius
                },
                if wall {
                    area.width as f64 / scale
                } else {
                    s.play_radius
                },
            ) * scale) as i32,
        y: base.y
            + (dy.clamp(
                if wall {
                    -(area.height as f64) / scale
                } else {
                    -s.play_radius
                },
                if wall {
                    area.height as f64 / scale
                } else {
                    s.play_radius
                },
            ) * scale) as i32,
    };
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let dest = monitor::clamp(dest, size.width, size.height, area);
    window
        .set_position(PhysicalPosition::new(dest.x, dest.y))
        .map_err(|e| e.to_string())?;
    if returning {
        *home = None;
    }
    Ok(())
}
pub fn show_menu(app: &AppHandle) -> Result<(), String> {
    let menu = app.get_webview_window("menu").ok_or("Menu missing")?;
    let p = platform::cursor()?;
    let areas = monitor::all(app)?;
    let area = monitor::nearest(&areas, p);
    let size = menu.outer_size().map_err(|e| e.to_string())?;
    let p = monitor::clamp(p, size.width, size.height, area);
    menu.set_position(PhysicalPosition::new(p.x, p.y))
        .map_err(|e| e.to_string())?;
    menu.show()
        .and_then(|_| menu.set_focus())
        .map_err(|e| e.to_string())
}
