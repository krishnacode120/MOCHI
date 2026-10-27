# Troubleshooting

**`cargo metadata ... program not found`:** Install Rust with rustup and open a new terminal. Check `cargo --version`. This is the native build blocker observed in the development environment.

**Missing MSVC / linker / Windows SDK:** Use Visual Studio Build Tools' Desktop development with C++ workload and current Windows SDK. `npm run tauri info` checks these prerequisites. An empty Visual Studio directory is not enough.

**WebView2 missing:** Install the official Microsoft runtime manually. The packaged application does not fetch it. Normal Mochi usage does not need administrator rights.

**Mochi isn't visible:** Left-click the tray icon, then Reset Position. In Settings, disable fullscreen pause temporarily if the foreground window is fullscreen. If the renderer cannot initialize WebGL or its native region, open Settings to see the error. Do not assume a browser preview proves native transparency.

**Cannot click Mochi:** Right-click the tray icon and choose Toggle Click-Through / Restore Interaction. The same command restores the mouse-interactions setting. Tiny transparent pixels inside the geometric silhouette can be interactive; the outer rectangle should not be. Native Windows testing is still required.

**Menu appears on the wrong display / clips during DPI changes:** Reset Position, then select a home monitor. Please record monitor scaling, taskbar edge, and whether the monitor was unplugged. Monitor hotplug recovery runs every three seconds. No screenshots are captured automatically.

**Settings are not saved:** Check write access to Tauri's application config directory and the error in Settings. A malformed file is preserved as `settings.invalid.json`; valid fields are range checked. Quit Mochi before editing configuration manually. `%APPDATA%\com.mochi.desktop` is the normal location unless Windows redirects it.

**High activity or stuttering:** Enable battery saver or reduced motion; disable particles/Pip or spontaneous activities. The dev canvas exposes `data-fps` for inspection. There is no claim of a measured CPU percentage or long-session leak profile.

**No interaction sound:** Mute is on by default; quiet mode also mutes. Enable sound, choose a volume, and click Say hello. Browser autoplay rules may require a direct pointer gesture before AudioContext can resume.

**Browser preview cannot move over the desktop:** Expected. Browser mode previews artwork/settings only; use `npm run tauri dev` for Windows features. The preview uses its own localStorage configuration and does not change native startup settings.

**NSIS output missing:** Native compilation must succeed before packaging. Run `Get-ChildItem .\src-tauri\target\release\bundle\nsis\*.exe` after a successful build. No installer was generated in this environment. Build dependencies may need downloading even though the runtime is offline.
