# Windows setup

## Prerequisites

Install these explicitly; MOCHI does not install toolchains or other third-party software itself:

1. Node.js LTS and npm. This repository was checked with Node 22.14.0 and npm 10.2.3.
2. Git.
3. Current stable Rust using [rustup](https://rustup.rs/), with the `x86_64-pc-windows-msvc` toolchain. The resolved dependencies require Rust 1.90 or newer. Rust 1.99.1 was installed with the user's approval on 26 October 2026.
4. [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with **Desktop development with C++**, current MSVC, and a Windows 10/11 SDK. A directory named Visual Studio does not prove the compiler components are installed.
5. [Microsoft Edge WebView2 Evergreen Runtime](https://developer.microsoft.com/microsoft-edge/webview2/). Tauri info detected 155.0.4283.62 on the development machine. The NSIS configuration uses `webviewInstallMode: skip` so it does not silently download third-party software. Deployment machines must have the runtime already.

Open a new PowerShell session after toolchain installation:

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
node --version
npm --version
cargo --version
rustc --version
git --version
npm ci
npm run tauri info
```

If PowerShell blocks npm.ps1, use `npm.cmd` instead of weakening execution policy.

The setup performed here did not modify the global PATH. The repository's `npm run tauri` wrapper automatically finds the standard rustup directory for its child process; the session-only PATH line above enables direct `cargo` commands.

## Development

From the repository root, `npm run tauri dev` launches Vite and the Windows executable. The pet waits for its first native hit region before becoming visible. Settings open from the tray. `npm run dev` runs only the explicitly labeled browser preview. It is useful for artwork but is not a substitute for desktop testing.

No internet is needed by the built app. Installing npm/crate dependencies and downloading Tauri's NSIS build tooling can require network access during development. A disconnected build requires those tools and dependencies to be cached in advance.

## Production

```powershell
npm ci
npm run test
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build
Get-ChildItem .\src-tauri\target\release\bundle\nsis\*.exe
```

The release executable is `src-tauri/target/release/mochi-desktop.exe`; the current installer is `src-tauri/target/release/bundle/nsis/Mochi_0.2.0_x64-setup.exe`. `node scripts/prepare-download.mjs` copies it into `downloads/` and generates its SHA-256 checksum. No signing certificate is configured. Keep Cargo.lock to pin the native dependency graph.

The installer runs for the current user and creates **Mochi Start-Stop** on the Windows Desktop. Double-click it to launch MOCHI; use it again to request a clean shutdown. The shortcut uses `--toggle`, so it does not forcibly terminate the process. For source builds, run `powershell -NoProfile -File scripts/create-desktop-shortcut.ps1` after compiling.

Right-click Mochi or its tray icon to open Settings. Enable **Greet me at sign-in** only if desired. Closing Settings keeps the companion running. **Settings → Reminders** controls water, stretching, and eye-break cards; water is enabled at 45 minutes by default. Autostart is not enabled by installing MOCHI.

Rust and Microsoft C++/SDK build tools were installed with the user's explicit approval. MOCHI 0.2.0 was installed for the current user to fulfill the desktop shortcut request.


Reference: [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/), [NSIS distribution](https://v2.tauri.app/distribute/windows-installer/), [autostart](https://v2.tauri.app/plugin/autostart/).
