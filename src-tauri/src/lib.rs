mod cursor;
mod desktop;
mod monitor;
mod platform;
mod reminders;
mod settings;
mod tray;
use settings::{Config, Persisted, Settings, Stats};
use tauri::{AppHandle, Emitter, Manager, RunEvent, WebviewWindow, WindowEvent};
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
fn load_settings(app: AppHandle) -> Persisted {
    app.state::<Config>().snapshot()
}

pub fn apply_settings(app: &AppHandle, mut settings: Settings) -> Result<(), String> {
    settings.validate();
    let config = app.state::<Config>();
    let previous = config.snapshot().settings;
    if settings.startup != previous.startup {
        let manager = app.autolaunch();
        if settings.startup {
            manager.enable()
        } else {
            manager.disable()
        }
        .map_err(|e| e.to_string())?;
    }
    config.data.lock().map_err(|e| e.to_string())?.settings = settings.clone();
    let result = (|| {
        desktop::apply(app)?;
        if previous.monitor != settings.monitor {
            desktop::recover(app, true)?;
            desktop::persist_position(app)?;
            app.emit_to("pet", "position-reset", ())
                .map_err(|e| e.to_string())?;
        }
        config.write()
    })();
    if let Err(e) = result {
        config.data.lock().map_err(|e| e.to_string())?.settings = previous.clone();
        let _ = desktop::apply(app);
        if settings.startup != previous.startup {
            let manager = app.autolaunch();
            let _ = if previous.startup {
                manager.enable()
            } else {
                manager.disable()
            };
        }
        return Err(e);
    }
    app.emit("settings-changed", settings)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    apply_settings(&app, settings)
}
#[tauri::command]
fn save_stats(app: AppHandle, mut stats: Stats) -> Result<(), String> {
    stats.validate();
    let config = app.state::<Config>();
    config.data.lock().map_err(|e| e.to_string())?.stats = stats;
    config.write()?;
    app.emit("stats-changed", stats).map_err(|e| e.to_string())
}
#[tauri::command]
fn get_monitors(app: AppHandle) -> Result<Vec<monitor::WorkArea>, String> {
    monitor::all(&app)
}
#[tauri::command]
fn current_reminder(app: AppHandle) -> Option<reminders::Reminder> {
    app.state::<reminders::Reminders>().current()
}
#[tauri::command]
fn preview_reminder(app: AppHandle, window: WebviewWindow, kind: usize) -> Result<(), String> {
    if window.label() != "settings" {
        return Err("Open reminder previews from Settings".into());
    }
    app.state::<reminders::Reminders>().preview(&app, kind)
}
#[tauri::command]
fn respond_reminder(
    app: AppHandle,
    window: WebviewWindow,
    id: u64,
    snooze: bool,
) -> Result<(), String> {
    if window.label() != "reminder" {
        return Err("Use the reminder card to respond".into());
    }
    app.state::<reminders::Reminders>()
        .respond(&app, id, snooze)
}
#[tauri::command]
fn window_command(app: AppHandle, command: String) -> Result<(), String> {
    if !["show", "hide", "settings", "reset", "quit", "menu"].contains(&command.as_str()) {
        return Err("Unknown window command".into());
    }
    if command != "menu" {
        if let Some(menu) = app.get_webview_window("menu") {
            let _ = menu.hide();
        }
    }
    tray::dispatch(&app, &command)
}
#[tauri::command]
fn pet_action(app: AppHandle, action: String) -> Result<(), String> {
    if ![
        "ceiling", "patrol", "rocket", "compact", "inspect", "recharge", "web", "swing", "sense",
        "meat", "punch", "hat", "movie", "write", "teleport", "fall", "hug", "story", "wonder",
        "shuffle", "summer", "collect", "pet", "tea", "play", "run", "climb", "explore",
        "hideSeek", "hop", "work", "watch", "stretch", "dance", "sleep", "wake", "pause", "resume",
        "outfit",
    ]
    .contains(&action.as_str())
    {
        return Err("Unknown pet action".into());
    }
    if let Some(menu) = app.get_webview_window("menu") {
        let _ = menu.hide();
    }
    app.emit_to("pet", "action", action)
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn publish_status(app: AppHandle, window: WebviewWindow, state: String) -> Result<(), String> {
    only_pet(&window)?;
    if ![
        "IDLE",
        "CURIOUS",
        "WALKING",
        "RUNNING",
        "CLIMBING",
        "EXPLORING",
        "HIDE_SEEK",
        "HOPSCOTCH",
        "MOVIE",
        "WRITING",
        "TELEPORTING",
        "FALLING",
        "HUGGING",
        "STORYTELLING",
        "WONDERING",
        "REASSEMBLING",
        "SUNBATHING",
        "CEILING_CRAWLING",
        "TREASURE_PATROL",
        "GUM_ROCKET",
        "COLLECTING",
        "COMPACTING",
        "INSPECTING",
        "RECHARGING",
        "WEB_SHOOTING",
        "WEB_SWINGING",
        "SPIDER_SENSE",
        "EATING_MEAT",
        "GUM_PUNCH",
        "HAT_TIP",
        "TYPING",
        "WATCHING",
        "STRETCHING",
        "SITTING",
        "PLAYING",
        "SLEEPING",
        "WAKING",
        "WAVING",
        "JUMPING",
        "DANCING",
        "DRINKING_TEA",
        "DRAGGING",
        "PAUSED",
    ]
    .contains(&state.as_str())
    {
        return Err("Invalid pet state".into());
    }
    app.state::<Paused>()
        .0
        .store(state == "PAUSED", std::sync::atomic::Ordering::Relaxed);
    app.state::<Resting>().0.store(
        matches!(state.as_str(), "SLEEPING" | "WAKING" | "DRAGGING"),
        std::sync::atomic::Ordering::Relaxed,
    );
    app.emit("status", serde_json::json!({ "state": state }))
        .map_err(|e| e.to_string())
}
fn only_pet(window: &WebviewWindow) -> Result<(), String> {
    if window.label() != "pet" {
        Err("Only the pet renderer may call this command".into())
    } else {
        Ok(())
    }
}
#[tauri::command]
fn set_hit_regions(
    app: AppHandle,
    window: WebviewWindow,
    regions: Vec<desktop::HitEllipse>,
) -> Result<(), String> {
    only_pet(&window)?;
    if regions.is_empty()
        || regions.len() > 64
        || regions.iter().any(|r| {
            ![r.x, r.y, r.width, r.height].iter().all(|v| v.is_finite())
                || r.x < -100.
                || r.y < -100.
                || r.x > 420.
                || r.y > 440.
                || r.width <= 0.
                || r.height <= 0.
                || r.width > 400.
                || r.height > 400.
        })
    {
        return Err("Invalid character region".into());
    }
    let scale = window.scale_factor().map_err(|e| e.to_string())?
        * app.state::<Config>().snapshot().settings.size;
    platform::region(&window, &regions, scale)?;
    // Show only after artwork and a native hit region are ready, avoiding a rectangular flash.
    let initialized = app.state::<Initialized>();
    if !initialized
        .0
        .swap(true, std::sync::atomic::Ordering::Relaxed)
    {
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[tauri::command]
fn begin_drag(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    only_pet(&window)?;
    desktop::start_drag(&app)
}
#[tauri::command]
fn end_drag(app: AppHandle, window: WebviewWindow) -> Result<(), String> {
    only_pet(&window)?;
    desktop::finish_drag(&app)
}
#[tauri::command]
fn move_pet(
    app: AppHandle,
    window: WebviewWindow,
    dx: f64,
    dy: f64,
    returning: bool,
    wall: bool,
) -> Result<(), String> {
    only_pet(&window)?;
    desktop::move_relative(&app, dx, dy, returning, wall)
}
#[tauri::command]
fn movement_bounds(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<desktop::MovementBounds, String> {
    only_pet(&window)?;
    desktop::movement_bounds(&app)
}
struct Initialized(std::sync::atomic::AtomicBool);
struct Quitting(std::sync::atomic::AtomicBool);
struct Paused(std::sync::atomic::AtomicBool);
struct Resting(std::sync::atomic::AtomicBool);
pub fn shutdown(app: &AppHandle) {
    if app
        .state::<Quitting>()
        .0
        .swap(true, std::sync::atomic::Ordering::Relaxed)
    {
        return;
    }
    if let Some(worker) = app.try_state::<cursor::Worker>() {
        worker.stop();
    }
    let handle = app.clone();
    // Join off the UI thread so any in-flight window query can finish dispatching.
    std::thread::spawn(move || {
        if let Some(worker) = handle.try_state::<cursor::Worker>() {
            worker.join();
        }
        if let Some(config) = handle.try_state::<Config>() {
            if let Err(e) = config.write() {
                eprintln!("Could not save Mochi settings: {e}");
            }
        }
        handle.exit(0);
    });
}
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            if args.iter().any(|arg| arg == "--toggle") {
                shutdown(app);
                return;
            }
            let _ = tray::dispatch(app, "show");
            let _ = tray::dispatch(app, "settings");
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        // Plugins initialize before webviews. An eager webview or DPI event must
        // never observe an uninitialized settings store during window creation.
        .plugin(
            tauri::plugin::Builder::<tauri::Wry, ()>::new("mochi-state")
                .setup(|app, _| {
                    let config = Config::load(app).map_err(std::io::Error::other)?;
                    if let Ok(enabled) = app.autolaunch().is_enabled() {
                        config
                            .data
                            .lock()
                            .unwrap_or_else(|e| e.into_inner())
                            .settings
                            .startup = enabled;
                    }
                    app.manage(config);
                    Ok(())
                })
                .build(),
        )
        .manage(desktop::Desktop::default())
        .manage(Initialized(std::sync::atomic::AtomicBool::new(false)))
        .manage(Quitting(std::sync::atomic::AtomicBool::new(false)))
        .manage(Paused(std::sync::atomic::AtomicBool::new(false)))
        .manage(Resting(std::sync::atomic::AtomicBool::new(false)))
        .manage(reminders::Reminders::default())
        .setup(|app| {
            if app
                .state::<Quitting>()
                .0
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                app.handle().exit(0);
                return Ok(());
            }
            desktop::restore(app.handle()).map_err(std::io::Error::other)?;
            tray::install(app.handle())?;
            app.manage(cursor::Worker::start(app.handle().clone()));
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            WindowEvent::Focused(false) if window.label() == "menu" => {
                let _ = window.hide();
            }
            WindowEvent::ScaleFactorChanged { .. } if window.label() == "pet" => {
                let app = window.app_handle().clone();
                let _ = window.run_on_main_thread(move || {
                    if app.try_state::<Config>().is_none() {
                        return;
                    }
                    if let Err(e) = desktop::recover(&app, false) {
                        let _ = app.emit("native-error", e);
                    }
                });
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            save_stats,
            get_monitors,
            window_command,
            pet_action,
            publish_status,
            set_hit_regions,
            begin_drag,
            end_drag,
            move_pet,
            movement_bounds,
            current_reminder,
            preview_reminder,
            respond_reminder
        ])
        .build(tauri::generate_context!());
    let app = match app {
        Ok(app) => app,
        Err(error) => {
            platform::show_error(&format!("Mochi could not start. Check that WebView2 is installed and the settings directory is writable.\n\n{error}"));
            return;
        }
    };
    app.run(|app, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            if !app
                .state::<Quitting>()
                .0
                .load(std::sync::atomic::Ordering::Relaxed)
            {
                api.prevent_exit();
                shutdown(app);
            }
        }
    });
}
