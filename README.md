# MOCHI — Your Cozy Desktop Companion

An original, offline Windows desktop pet built with Tauri 2, Rust, React, TypeScript, PixiJS, GSAP, and Zustand. Mochi wears a soft hoodie, follows your pointer with curious eyes, takes little tea breaks, and rests when you do. Pip is an optional floating companion.

**Status: Windows release build and NSIS installer produced successfully.** A focused native check confirmed rendering, the interaction menu, Settings, saved changes, single-instance reopening, and clean exit. Version 0.2.0 adds tested reminder scheduling and a verified desktop Start-Stop shortcut. Per-user installation passed; multi-monitor/DPI and uninstallation remain manual. See [verification status](docs/verification.md).

## Install and use

[Download MOCHI 0.2.0 for Windows x64](downloads/Mochi_0.2.0_x64-setup.exe). Open the file on GitHub and choose **Download raw file**, then run it. WebView2 must already be installed. The installer is unsigned and installs for the current Windows user.

Double-click **Mochi Start-Stop** on your desktop to start the companion. Double-click the same shortcut again to stop it cleanly and save its settings. Right-click Mochi or its tray icon to open Settings.

## Gentle reminders

- **Water:** enabled by default, every 45 minutes of active time.
- **Stretch and eye breaks:** optional, with separate intervals.
- **Settings → Reminders:** enable/disable each kind, set intervals from 10–240 minutes, and preview a water reminder.
- Cards stay near Mochi, disappear after 45 seconds, and offer **In 5 min** or a friendly dismissal. They are silent and do not take keyboard focus.
- Timers pause during fullscreen, Quiet mode, pet sleep/drag/pause, hiding, and after five minutes without input. They resume without a backlog, with at least five minutes between cards. Reminder countdowns restart when the app restarts; your preferences persist.

The executable can also be launched directly from `src-tauri/target/release/mochi-desktop.exe`. To create the Start-Stop shortcut for a local source build:

```powershell
powershell -NoProfile -File scripts/create-desktop-shortcut.ps1
```

![A gentle water reminder from Mochi](docs/reminder-card.png)

## Run

Install the [Windows prerequisites](docs/setup-windows.md), then from this directory:

```powershell
npm ci
npm run tauri dev
```

For a labeled browser-only animation/settings preview:

```powershell
npm run dev
```

Open http://127.0.0.1:1420/. Browser mode uses local preview cursor coordinates and localStorage; it cannot exercise Windows integration.

## What is implemented

- Four native windows: a transparent borderless pet, a settings window, a compact context menu, and a gentle reminder card. Only Settings appears in the taskbar.
- Original layered vector Mochi, three hoodie palettes, blinking, breathing, gaze, waving, jumping, walking, sleeping/waking, dancing, sitting, tea, and play animations. Separate finite-state machine and deterministic-testable scheduler.
- Native Windows global cursor polling, system-idle detection, cursor velocity, DPI conversion, work-area placement, monitor recovery, dragging, position persistence, and bounded excursions that return home.
- Windows GDI character-shaped regions, explicit click-through, and a tray escape route. **This is a geometric silhouette approximation, not per-pixel alpha hit testing.** Native behavior still needs the checks in `docs/verification.md`.
- Tray show/hide/settings/pause/resume/actions/click-through/reset/startup/quit and single-instance handling.
- Validated local JSON settings; atomic replacement and invalid-file preservation. Optional stats have no punitive decay.
- Fullscreen rendering suspension, lower polling when inactive, 30 FPS battery mode, particle pooling, reduced motion, optional synthesized sounds (muted by default).
- Local layered PNG and sprite-sheet loader interfaces for future bundled characters. No arbitrary downloaded model execution or user-facing importer in v0.1.
- Per-user NSIS packaging with a desktop Start-Stop shortcut and a Windows CI workflow. WebView2 must already be installed; the installer is configured not to download it.

## Controls

Single click says hello. Double click jumps; the single-click action is delayed to avoid duplicate actions. Drag the character to place it. Right click opens the interaction menu. In click-through mode, right-click the **Mochi tray icon** and choose **Toggle Click-Through / Restore Interaction**. Closing Settings keeps Mochi running. Choose **Quit Mochi** in the tray to exit.

Settings are in `%APPDATA%\com.mochi.desktop\settings.json` (resolved with Tauri's `app_config_dir`; Windows folder redirection may change the physical path). Startup is opt-in through Tauri's autostart plugin. Cursor samples are transient and stay on this computer. No network client, telemetry, account, screenshot capture, or keyboard-content collection is implemented.

## Focused checks

```powershell
npm run typecheck
npm run test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

The frontend suite contains ten behavioral and boundary tests, rather than UI snapshot or redundant implementation tests. Rust tests cover settings, serialization, velocity, and monitor boundaries. Run the Windows manual checklist only when native changes need verification.

## Build an installer

```powershell
npm run tauri build
Get-ChildItem .\src-tauri\target\release\bundle\nsis\*.exe
```

The output is `src-tauri/target/release/bundle/nsis/Mochi_0.2.0_x64-setup.exe`. Run `node scripts/prepare-download.mjs` after a successful build to copy the current installer and SHA-256 checksum into `downloads/`. Signing is not configured. The remaining desktop and installation checks are listed in the verification document.

## Project map

- `src/characters/`: original artwork, Pip, and future asset adapters
- `src/engine/`: animation, state machine, behavior, particles, coordinate helpers
- `src/components/`: pet renderer, settings, custom menu
- `src/services/`: typed native bridge and local sound synthesis
- `src-tauri/src/`: Windows adapter, cursor worker, desktop/monitor logic, tray, persistence
- `docs/`: setup, architecture, animation, troubleshooting, verification

See [architecture](docs/architecture.md), [animation system](docs/animation-system.md), [setup](docs/setup-windows.md), and [troubleshooting](docs/troubleshooting.md). Original project code/artwork is MIT licensed; GSAP has its own standard license. See [third-party notices](THIRD_PARTY_NOTICES.md).
