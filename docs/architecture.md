# Architecture and boundaries

## Implementation roadmap

1. Foundation: Vite/React, native Tauri windows, tray, positioning, settings.
2. Character: original articulated vectors, animation timelines, one finite-state machine.
3. Desktop: native cursor/idle service, drag, shaped regions, explicit click-through.
4. Personality: scheduler, quiet sleep/wake, tea, bounded play, optional stats.
5. Polish: Pip, pooled effects, settings palettes, power controls, persistence.
6. Release: focused tests, Windows build configuration, documentation, native acceptance once prerequisites exist.

Source for these stages is present. The Windows release build and NSIS packaging succeeded on 26 October 2026. A focused native smoke check passed; the verification document separates those results from remaining manual acceptance checks.

## Processes and ownership

Tauri owns one process with four webviews. The `pet` webview owns the state machine, GPU scene, behavior scheduler, and stats timer. It changes Zustand only on state/settings/stat updates, not every animation frame. Settings and menu webviews send typed action strings; they never run another native pet scene. The single-instance plugin makes a second invocation reveal the existing app.

The Rust `Config` is the persisted source of truth. Its JSON schema has defaults and bounded numbers; arbitrary strings are checked against allowlists. Settings are applied before broadcast. Startup uses the official plugin and is rolled back if applying the rest of a change fails. JSON writes are serialized, flushed, and atomically replaced with `MoveFileExW`; malformed settings are copied to `settings.invalid.json` before defaults are used. I/O errors surface instead of silently destroying configuration.

The cursor worker polls at 25 Hz, drops to 12.5 Hz on battery or manual saver, and 5 Hz while idle/hidden/fullscreen. It retains only the previous point/time and stationary timestamp. `GetCursorPos`, `GetLastInputInfo`, and `GetTickCount` provide global position and session idle time. Velocity is physical pixels per second. Samples contain virtual desktop coordinates plus renderer coordinates calculated by `(physical - window origin) / (DPI scale * character scale)`.

`platform.rs` contains unsafe Windows calls; no global hooks are installed. The application reads only the left-button pressed state during an explicit drag, not keyboard text. `desktop` owns dragging and temporary excursion origins. Work areas come from Tauri's maintained Windows monitor adapter, which exposes the actual work rectangle, including taskbar placement. Nearest-monitor clamping handles negative desktop coordinates. Work-area recovery runs every three seconds and on scale-factor changes. Initial placement uses the primary monitor unless a home monitor is configured. Window padding leaves the visible feet about 22 logical pixels above the work edge.

## Real input regions

`SetWindowRgn` receives a union of elliptical visual envelopes around the articulated hoodie, head, hood ears, hair tuft, limbs, shadow, Pip, and active particles. Bounds are recomputed at most 10 Hz and scaled to physical pixels. The HWND is clipped by Windows; transparent space outside the region cannot receive input. This is an intentional character-shaped approximation, **not per-pixel alpha transparency**. Up to a few pixels inside the envelopes can remain transparent yet interactive. Regions include tiny effects so Windows does not clip them; these are bounded and do not introduce a large rectangular overlay.

Windows assumes ownership of successfully applied HRGNs; failure paths release them. A separate menu window has its own input area and hides on blur. Explicit click-through calls Tauri's `set_ignore_cursor_events`. The tray can restore interactivity even when all pet mouse interactions are disabled. Region clipping with WebView2, rapid animation, dragging, and fractional DPI needs actual desktop acceptance testing before release.

## Rendering and shutdown

PixiJS uses a small transparent WebGL canvas and reusable graphics. GSAP has one transition timeline at a time; state changes kill the previous timeline. Particles use a fixed pool of 32. Reduced motion disables particle effects and large gestures; battery mode targets 30 FPS. Fullscreen and hidden states suspend animation advancement and lower the renderer tick to 5 Hz to detect resume. Explicit pause uses the same 5 Hz heartbeat. This is reduced work, not zero rendering, and no CPU or GPU percentage is claimed.

Graceful Quit sets the worker stop flag, joins it on a separate thread while the event loop still services in-flight window calls, flushes configuration, and exits. Frontend teardown destroys Pixi objects, GSAP timelines, timers, and subscriptions. Native service errors are rate limited and shown in settings. Persistent position is updated on explicit drag completion/reset, not on every play frame.

## Offline and extension rules

Production CSP permits local assets and Tauri IPC, not remote HTTP or remote scripts. Pixi's `pixi.js/unsafe-eval` compatibility module supplies static shader bindings so rendering works without enabling JavaScript eval. There are no network, shell, filesystem, or global-shortcut plugin permissions exposed to the frontend. Native mutations use validated commands; region/movement commands are restricted to the `pet` webview. Startup is opt-in. Sounds are locally synthesized and off by default.

`CharacterAsset` supports bundled layered PNG and Pixi spritesheets for future characters. A user-facing importer, Live2D, arbitrary app-window attachment, multiple pet instances, weather, gardens, and achievements are not implemented. They can be added behind the character adapter without rewriting the native cursor service.

References: [Tauri monitor work areas](https://docs.rs/tauri/latest/tauri/window/struct.Monitor.html), [Windows region ownership](https://learn.microsoft.com/windows/win32/api/winuser/nf-winuser-setwindowrgn), [single-instance plugin](https://v2.tauri.app/plugin/single-instance/).

## Reminders and desktop toggle

The existing cursor worker also ticks a native active-time reminder scheduler once per second. Water defaults to 45 minutes; stretch and eye breaks are independently optional. A separate small webview shows one card near the pet without focusing it. The scheduler freezes while unavailable, caps long timer gaps, expires cards after 45 seconds, spaces cards by at least five active minutes, and accepts responses only for the current card ID. Preview cards do not alter real reminder deadlines. Preferences persist, while countdowns are session-only.

The `--toggle` argument is handled by the single-instance callback: a second invocation requests graceful shutdown; the first invocation launches normally. The NSIS hook creates a per-user desktop shortcut with this argument and removes it on uninstall. The source-build shortcut helper uses the Windows Desktop known folder and the actual executable icon.
