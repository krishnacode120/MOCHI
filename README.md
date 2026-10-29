# MOCHI — Your Cozy Desktop Companion

An original, offline Windows desktop pet built with Tauri 2, Rust, React, TypeScript, PixiJS, and Zustand. Mochi wears a soft hoodie, follows your pointer with curious eyes, takes little tea breaks, and rests when you do. Pip is an optional floating companion.

**Status: Windows release build and NSIS installer produced successfully.** Version 0.6.2 adds illustrated care cards, corrected reminder scheduling, and weather-responsive accessories for all five characters. Poses and routes share an action clock; speed changes no longer restart gestures. The installed app passed a focused visual check of the characters and cozy props. Per-user installation passed; multi-monitor/DPI and uninstallation remain manual. See [verification status](docs/verification.md).

## Install and use

[Download MOCHI 0.6.2 for Windows x64](downloads/Mochi_0.6.2_x64-setup.exe). Open the file on GitHub and choose **Download raw file**, then run it. WebView2 must already be installed. The installer is unsigned and installs for the current Windows user.

Double-click **Mochi Start-Stop** on your desktop to start the companion. Double-click the same shortcut again to stop it cleanly and save its settings. Right-click Mochi or its tray icon to open Settings.

## Characters and cozy scenes

- **Settings → Character → Your desktop friend:** choose Mochi, WALL-E, Olaf, Spider-Man, or Luffy. Settings portraits render the same stylized fan artwork as the desktop pet.
- **Olaf:** warm hugs, expressive storytelling, curious thoughts, detachable snowball/head/nose antics, a playful waddle, and dreams of summer. These are scripted character behaviors, not real emotional or screen-content analysis.
- **WALL-E:** weathered chassis, binocular eyes and rigid treads; plant protection, compacting cubes, treasure inspection, solar recharge, and a floor patrol with inspection stops.
- **Spider-Man:** red/blue suit, white mask lenses, web pattern and chest emblem; wall crawling, wrist webs, full-width swinging, spider-sense, and an inverted ceiling patrol.
- **Luffy:** straw hat, black hair, under-eye scar, red vest and sandals; meat eating, elastic Gum-Gum punches, a hat-tip greeting, and full-screen rocket jumps.
- **Full-screen trips:** web swings and rocket jumps visit both sides and the upper work area. Pip play uses the full width. All trips return home. Settings > Behavior > Explore the desktop starts your character's tour.
- **Varied behavior:** signature activities are weighted by character and avoid the last three choices. Switching characters clears incompatible queued actions. Quiet mode and reduced motion remain supported.
- See [character references](docs/character-references.md) for the reference sources and implementation scope.
- **Blanket naps:** automatic inactivity sleep curls the character onto a pillow beneath a quilt, with a moon and twinkling stars. Sleep thresholds remain in Behavior settings.
- **Movie time:** popcorn and cola accompany you during fullscreen playback. Start and end Movie time from the action buttons or tray; Mochi does not identify or read movies automatically.
- **Work with me / Write at desk:** a small wooden desk, laptop or notebook, and hand/pencil movement. No actual typed text is displayed or saved.
- **Teleport / Tumble down:** fade between screen positions, or fall, bounce, and recover. Routes remain inside the current monitor work area and return home; reduced motion suppresses travel.
- **Weather reactions:** rain brings an umbrella, sunshine brings sunglasses, and snow/wind bring a cozy scarf. Olaf enjoys snow; Luffy holds his hat in wind. Props ease in and out, stay still with reduced motion, and are stowed for sleep and acrobatics.
- **Settings → Behavior → Weather scene:** Off, Auto, Sunny, Rain, Snow, or Wind. Auto cycles every 75 active seconds. These are local decorative scenes, without location access or live forecasts. Quiet mode hides weather; reduced motion keeps it still.

## A companion for your workday

- **Roam the whole screen:** enabled by default. Runs use the full width of the current monitor; balloon tours visit its upper and lower corners. All trips stay inside the work area and return home. Turn this off in Settings → Behavior for smaller adventures.
- **Climb wall:** approach the nearest screen edge, climb up, pause, and come down. It does not climb arbitrary application windows.
- **Hide & seek:** Mochi scoots to an edge and peeks out. Click the peeking character (or Pet Mochi) to find them and get a wave. They automatically reappear if you do not join in.
- **Balloon tour / Hopscotch:** original balloons carry Mochi around the screen; hopscotch adds a series of playful hops.
- **Play with Pip:** Pip swoops around Mochi during a little chase. **Watch** adds curious glances and head tilts; **Stretch** gives Mochi a break too.
- **Type along with me:** enabled under Settings → Behavior. Mochi opens a tiny laptop when keyboard activity is detected, taps along, then settles when you stop. The laptop shows decorative strokes, never your actual text.
- Only a transient keyboard-active boolean is sent to the renderer. Key identities and typed text are never retained, logged, or transmitted. No screenshots, document reading, camera, AI model, or screen understanding is involved.
- Settings → Character and the right-click menu offer immediate action buttons. Settings → Behavior lets you disable spontaneous running/climbing or typing reactions independently. Quiet mode suppresses automatic reactions; reduced motion removes travel and vigorous animation.
- Motion now uses eased routes, blended poses, frame-rate-independent Pip movement, and more frequent silhouette updates. Speed changes preserve action progress.

## Gentle reminders

- **Cute care cards:** illustrated water, stretch, and eye-break designs with a native-timed 45-second closing countdown. Previews never change your schedule.
- **Timing:** opening a card no longer pauses other reminder timers. Regular cards stay five active minutes apart; snoozes become due after five active minutes and wait only if another card is open. Acknowledging starts a fresh interval; restarting Mochi starts fresh timers.
- **Water:** enabled by default, every 45 minutes of active time.
- **Stretch and eye breaks:** optional, with separate intervals.
- **Settings → Reminders:** enable/disable each kind, set intervals from 10–240 minutes, and preview all three card styles.
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

The frontend suite contains 28 focused behavioral, artwork, and boundary checks. Rust tests cover settings, serialization, velocity, and monitor boundaries. Run the Windows manual checklist only when native changes need verification.

## Build an installer

```powershell
npm run tauri build
Get-ChildItem .\src-tauri\target\release\bundle\nsis\*.exe
```

The output is `src-tauri/target/release/bundle/nsis/Mochi_0.6.2_x64-setup.exe`. Run `node scripts/prepare-download.mjs` after a successful build to copy the current installer and SHA-256 checksum into `downloads/`. Signing is not configured. The remaining desktop and installation checks are listed in the verification document.

## Project map

- `src/characters/`: original artwork, Pip, and future asset adapters
- `src/engine/`: animation, state machine, behavior, particles, coordinate helpers
- `src/components/`: pet renderer, settings, custom menu
- `src/services/`: typed native bridge and local sound synthesis
- `src-tauri/src/`: Windows adapter, cursor worker, desktop/monitor logic, tray, persistence
- `docs/`: setup, architecture, animation, troubleshooting, verification

See [architecture](docs/architecture.md), [animation system](docs/animation-system.md), [setup](docs/setup-windows.md), and [troubleshooting](docs/troubleshooting.md). Original project code/artwork is MIT licensed; GSAP has its own standard license. See [third-party notices](THIRD_PARTY_NOTICES.md).
