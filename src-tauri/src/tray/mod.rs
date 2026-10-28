use crate::{desktop, settings::Config};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
pub fn install(app: &AppHandle) -> tauri::Result<()> {
    let menu = Menu::new(app)?;
    for (id, label) in [
        ("show", "Show Mochi"),
        ("hide", "Hide Mochi"),
        ("settings", "Open Settings"),
        ("pet", "Pet Mochi"),
        ("tea", "Give Tea"),
        ("play", "Play"),
        ("movie", "Movie Time / End Movie"),
        ("write", "Write at Desk"),
        ("teleport", "Teleport"),
        ("fall", "Tumble Down"),
        ("run", "Run Around"),
        ("climb", "Climb the Wall"),
        ("explore", "Balloon Tour"),
        ("hideSeek", "Hide and Seek"),
        ("hop", "Hopscotch"),
        ("work", "Work With Me"),
        ("stretch", "Stretch"),
        ("dance", "Dance"),
        ("sleep", "Sleep"),
        ("wake", "Wake"),
        ("outfit", "Change Outfit"),
        ("pause", "Pause Animations"),
        ("resume", "Resume Animations"),
        ("clickThrough", "Toggle Click-Through / Restore Interaction"),
        ("reset", "Reset Position"),
        ("startup", "Toggle Launch on Startup"),
    ] {
        menu.append(&MenuItem::with_id(app, id, label, true, None::<&str>)?)?;
    }
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&MenuItem::with_id(
        app,
        "quit",
        "Quit Mochi",
        true,
        None::<&str>,
    )?)?;
    let icon = tauri::image::Image::from_bytes(include_bytes!("../../icons/32x32.png"))?;
    TrayIconBuilder::with_id("mochi-tray")
        .icon(icon)
        .tooltip("Mochi — your cozy companion")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if let Err(e) = dispatch(app, event.id.as_ref()) {
                let _ = app.emit("native-error", e);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let _ = dispatch(tray.app_handle(), "show");
            }
        })
        .build(app)?;
    Ok(())
}
pub fn dispatch(app: &AppHandle, command: &str) -> Result<(), String> {
    match command {
        "show" => desktop::pet(app)?.show().map_err(|e| e.to_string()),
        "hide" => desktop::pet(app)?.hide().map_err(|e| e.to_string()),
        "settings" => {
            let w = app
                .get_webview_window("settings")
                .ok_or("Settings window missing")?;
            w.show()
                .and_then(|_| w.set_focus())
                .map_err(|e| e.to_string())
        }
        "reset" => {
            desktop::finish_drag(app)?;
            desktop::recover(app, true)?;
            desktop::persist_position(app)?;
            app.emit_to("pet", "position-reset", ())
                .map_err(|e| e.to_string())?;
            desktop::pet(app)?.show().map_err(|e| e.to_string())
        }
        "quit" => {
            crate::shutdown(app);
            Ok(())
        }
        "menu" => desktop::show_menu(app),
        "clickThrough" | "startup" => {
            let mut s = app.state::<Config>().snapshot().settings;
            if command == "clickThrough" {
                s.click_through = if !s.interactions {
                    false
                } else {
                    !s.click_through
                };
                s.interactions = true;
            } else {
                s.startup = !s.startup;
            }
            crate::apply_settings(app, s)
        }
        "movie" | "write" | "teleport" | "fall" | "hug" | "story" | "wonder" | "shuffle"
        | "summer" | "collect" | "pet" | "tea" | "play" | "run" | "climb" | "explore"
        | "hideSeek" | "hop" | "work" | "watch" | "stretch" | "dance" | "sleep" | "wake"
        | "pause" | "resume" | "outfit" => app
            .emit_to("pet", "action", command)
            .map_err(|e| e.to_string()),
        _ => Err("Unknown tray command".into()),
    }
}
