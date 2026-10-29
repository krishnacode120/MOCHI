# Verification status — 29 October 2026

## MOCHI 0.6.3 — compact and custom reminders

- Reduced native and browser-preview cards from 360 × 300 to 280 × 190 (about half the screen area). Smaller illustrations, shorter copy, tighter spacing, and compact buttons retain the cute styling, snooze, and countdown.
- Added up to 10 locally saved custom reminders with title, message, interval, style, preview, editing, pause/enable, and removal. Stable scheduler slots keep a deleted or reordered reminder from transferring its timer to another reminder. The shared scheduler retains active-time eligibility, overdue ordering, spacing, and snooze behavior.
- No tests or UI checks were run, as requested. Production TypeScript/Vite compilation, native release compilation, and NSIS packaging completed successfully. Per-user installation returned exit code 0, and Mochi was restarted.
- Installer: `downloads/Mochi_0.6.3_x64-setup.exe` — 1,562,017 bytes. SHA-256: `5fc9af17f21ad2a60fa96207e45b72bac75a32080ad84c567dbae336fb757206`.

## MOCHI 0.6.2 — reminder and weather update

- Six focused standalone Rust reminder-clock tests passed, without rebuilding the full Rust test suite. They cover active-time suspension, interval changes, disabled reminders, card spacing, five-minute snoozes, timers continuing behind an open card/preview, and snoozes becoming due independently of another card’s cooldown.
- Five focused scene tests passed, including shared Auto-weather timing, quiet/sleep suppression, accessory bounds across all five characters, and immediate stowing before acrobatics. The existing Pixi Graphics-child deprecation warning remains non-failing.
- Reminder cards now use separate water/stretch/eye illustrations, pastel colors, a 45-second closing countdown initialized from native remaining time, and an explicit preview-only close button. A stale initial snapshot can no longer replace a newer reminder event.
- Timers still measure eligible active time, not wall-clock time. Fullscreen, hidden, quiet, paused, sleeping, and long-inactive periods pause them. Regular cards remain spaced five active minutes apart; a snooze becomes due after five active minutes and waits if another card is still open. Restarting the app resets reminder timers.
- Clothing follows the same weather resolver as particles: rain umbrella, sunny sunglasses, snow/wind scarf. Olaf responds happily to snow; other characters make occasional small shivers, and Luffy holds his hat in wind. Reduced motion removes flutter/shiver. Sleep and acrobatics stow accessories to prevent clipping.
- Final TypeScript/Vite build and native release compilation passed. Packaging initially hit a restricted-network NSIS lookup error; the permitted packaging retry succeeded. Per-user installation returned exit code 0 and Settings displayed 0.6.2.
- The installed 360 × 300 water card displayed the illustration, complete copy and close button without clipping. Its countdown advanced from 33 to 24 seconds; clicking the preview close button dismissed it. Native Mochi visibly carried the rain umbrella, wore the snow scarf, and wore sunny sunglasses. Weather was set to Auto afterward to enable cycling. Existing reminder interval controls showed water 30, stretch 50, and eyes 30 minutes; those values were left unchanged.
- Installer: `downloads/Mochi_0.6.2_x64-setup.exe` — 1,553,895 bytes. SHA-256: `75da5a899b0e3a9ccdaacc474f1c42f5987291346fa3fecfd0495f66de2fbf73`.
- No screenshots containing the desktop were saved or uploaded. The five-minute deadline was checked with the clock tests rather than a long live wait. Full native visual coverage of every character/weather combination, multi-monitor/DPI, and long-duration use remain manual.

## MOCHI 0.6.1 — previous delivery

- TypeScript and the production frontend build passed. The expanded 25-test suite passed; an additional targeted ceiling-pose regression caught and verified the fix for clipping during rotation (26 checks total). WALL-E first-frame pupil placement is also covered.
- New route checks verify both travel directions, full-width and upper-area coverage, small-radius opt-out, treasure inspection stops, and ceiling-patrol endpoints. The inverted-pose regression samples the entire 32-second motion inside the pet canvas.
- Coverage includes character-specific random pools, avoiding three recent activities, queued-action reset on character switching, shared action-age pose timing, punch recovery, and screen-route bounds including web swinging. A pre-existing Pixi warning about Graphics children appears in the artwork test; it does not fail the check.
- Final 0.6.1 TypeScript/Vite build, native release compilation, and NSIS packaging passed. The per-user upgrade returned exit code 0; installed Settings reported version 0.6.1 and retained size 0.65 and speed 1.5.
- The installed ceiling patrol moved from (1455, 467) to the left screen edge and reached the top work-area edge. A timed middle-of-route capture at (1345, 1) visibly confirmed the inverted Spider-Man pose without clipped body parts. Native captures were 208 × 221 pixels at the retained size. This verifies actual window travel as well as the route calculations.
- Installed visuals confirmed Spider-Man's costume and wrist-fired web, Luffy's straw-hat design, meat eating and extended punch, and WALL-E's revised body/treads and solar panels. Settings now uses the same artwork as the pet. The visual check found WALL-E pupils initially offset in the static portrait; that was corrected and covered by the targeted test.
- Empty artwork bounds are excluded before native region padding, avoiding invisible input regions from unused parts. Character props remain included in the bounded native mask.
- Mochi was restored as the selected character. The desktop Start-Stop shortcut still targets `C:\Users\krishna\Applications\Mochi\mochi-desktop.exe` with `--toggle`.
- Final installer: `downloads/Mochi_0.6.1_x64-setup.exe` — 1,551,526 bytes. SHA-256: `4643ece1e584c319fa192374860db0ffdfbc5be5c3bb115f96b2f2cd9cf9a7ca`.
- No screenshots containing the user's background windows were saved or uploaded. No broad UI suite, separate Rust test rebuild, or soak test was added. All signature actions are implemented, but only the native poses listed above were visually checked. Multi-monitor/DPI, actual fullscreen playback, and real-keyboard observation remain manual.

## MOCHI 0.5.0 — previous delivery

- TypeScript and the production frontend build passed. All 18 focused tests passed, including movie-mode persistence/fullscreen suspension, settings migration, teleport fade timing, and existing route bounds coverage extended to teleporting/falling.
- Native release compilation produced the NSIS installer. The per-user upgrade returned exit code 0; size (0.65), speed (1.5), and existing preferences were retained.
- The installed app visibly rendered Mochi curled beneath the quilt with a moon and stars, both new character designs, Olaf with popcorn and cola, and WALL-E writing at the wooden desk. Auto weather visibly progressed through sun, rain, and snow. Character switching and the movie action controls worked.
- Mochi was restored as the selected character. Start-Stop cleanly exited with zero pet processes, then the installed 0.5.0 app was restarted. The desktop shortcut still targets the installed executable with `--toggle`.
- Movie mode is explicitly started/ended by the user. Fullscreen suspension is covered by a focused test; actual fullscreen film playback was not exercised. Weather is decorative and offline. Character personalities are scripted.
- No screenshots containing the user's background windows were added. No broad UI suite, separate Rust test rebuild, or long-duration test was run. Real keyboard reaction and multi-monitor/DPI checks remain manual as noted below.
- Installer: `downloads/Mochi_0.5.0_x64-setup.exe` — 1,570,831 bytes. SHA-256: `8907b088d3a6bc017ae93a5aa89b31851ef25ac62d9baf2b062fb431a0c9c5ea`.

## MOCHI 0.4.0 — previous delivery

- TypeScript and the production frontend build passed.
- All 15 focused frontend checks passed. New coverage verifies work-area bounds, full-area corner visits, return-home endpoints, automatic reveal, finding a hidden pet, typing opt-out/quiet mode, protected user actions, and action-time continuity across speed changes.
- The 0.3 preview native check verified the laptop/hand artwork, native wall-climbing movement, running movement, and action controls. A quick-key polling gap found during this check led to replacement with activity-only Windows event notifications in 0.4.
- Native release compilation and NSIS packaging passed. The per-user upgrade returned exit code 0; existing size (0.65), speed (1.5), and behavior preferences were retained.
- The 0.4 balloon artwork and actual travel into the upper screen rendered in the installed app; native hide-and-seek visibly peeks from the screen edge. The expanded Character action buttons rendered. No screenshots containing the user's background windows were added to the repository.
- Automatic keyboard activation could not be confirmed through the computer-use tool's synthetic key presses. The event listener compiled and its behavior integration is covered by the focused frontend tests; a real typing check remains manual. The callback never reads key-event payloads or typed text.
- After the final update, Start-Stop shutdown completed with zero MOCHI processes, then the installed app was restarted. The desktop shortcut still targets the installed executable with --toggle.
- Final installer: downloads/Mochi_0.4.0_x64-setup.exe — 1,555,703 bytes. SHA-256: a9acf490ba2130552b3d9de77d39101bb7748bcca96ad2f99acc41403b618bde.
- Multi-monitor/fractional DPI, long-duration performance, and uninstallation remain manual. No full Rust test rebuild, soak test, or unrelated UI suite was added.

## MOCHI 0.2.0 — previous delivery

- TypeScript and production frontend build passed. The native release and NSIS installer were rebuilt after fixing a settings-initialization race during window creation.
- Four focused reminder-clock tests passed: inactive time/resume gaps, five-minute snooze, spacing/disabled reminders, and interval changes. The full native test suite was not rerun.
- Per-user installation and the corrected upgrade returned exit code 0. The app was installed in the user's `Applications/Mochi` folder to avoid development-host AppData redirection.
- The desktop **Mochi Start-Stop** shortcut started the installed app. Reusing it stopped the app cleanly (zero MOCHI processes). It was then started again from the final installation folder.
- Settings reopened in the existing instance. Water was enabled at 45 minutes; optional stretch/eye controls rendered. The native water-reminder preview rendered and its **Had a sip** button was exercised. Capture: [reminder-card.png](reminder-card.png).
- The timer tests cover reminder scheduling without a 45-minute live wait. Multi-monitor/DPI, uninstallation, and long-duration performance checks remain manual.
- Current installer: `downloads/Mochi_0.2.0_x64-setup.exe` — 1,547,908 bytes. SHA-256: `c74f6b0d8b55009ee93e266b699dcac9ff835fb976288317ea16a6761c6eb7d1`.

## Original 0.1.0 checks

| Check | Observed result |
| --- | --- |
| Dependency install | 120 npm packages installed; package-lock.json generated |
| `npm run typecheck` | Passed |
| `npm run test` | Passed: 10 tests in 1 file |
| `npm run build` | Passed: TypeScript + Vite production assets in dist/ |
| Browser preview | Artwork, settings layout, and Pip visibly rendered; Sleep control changed state to sleeping |
| Windows build prerequisites | Rust/Cargo 1.99.1, MSVC 14.44, Windows SDK 10.0.26100.0; Microsoft setup returned 0. WebView2 155.0.4283.62 was already available |
| `npm run tauri build` | Passed: optimized Rust release compilation and NSIS packaging; native compilation took 6m 30s |
| Rust toolchain | Rust/Cargo 1.99.1 installed with user approval; Cargo.lock resolved and dependencies cached |
| Rust unit tests | Not run separately; production compilation was used for native validation to avoid another compilation/test pass |
| Native launch | Passed: Mochi/Pip render, right-click menu and native Settings open |
| Settings persistence | Hoodie changed visibly and `settings.json` contained the new value; original lavender was restored |
| Single instance | Second launch reopened existing Settings and pet windows |
| Close / Exit | Closing Settings left the pet running; Exit Mochi removed the app process |
| NSIS installation / uninstallation | Installer generated; installation cycle not run |

The final frontend rebuild passed with Pixi's CSP-compatible static bindings: the main bundle is about 241 kB and the deferred pet bundle about 368 kB before gzip, with no oversized-chunk warning. Native settings and menu windows do not load the PixiJS scene. No broad browser test suite, soak test, or CPU measurement was performed. Native Settings capture: [native-settings.png](native-settings.png).

## Historical 0.1.0 artifacts

- Executable: `src-tauri/target/release/mochi-desktop.exe` — 3,764,224 bytes.
- Installer: `src-tauri/target/release/bundle/nsis/Mochi_0.1.0_x64-setup.exe` — 1,538,963 bytes (1.47 MiB).
- Installer SHA-256: `86FC84250BD705FD3D90FB1C051297CD40E9DE0777B8BC9738C26F67C0A7715D`.
- Resolved dependency notices are generated and bundled in `THIRD_PARTY_LICENSES.txt`.

## Additional manual checks

1. For future native changes, run the focused Rust tests with `cargo test --lib --release --locked --manifest-path src-tauri/Cargo.toml` and rebuild. Keep Cargo.lock. A separate `cargo check` is unnecessary after a successful production build.
2. Check tray visibility, tray controls, and taskbar exclusion. Native rendering, Settings reopening, single-instance handling, and menu Exit already passed the focused check.
3. Put a normal clickable window behind Mochi. Click outside the silhouette, then inside it. Check waving, jumping, particles, and right-click menu edges for clipping/input interception. Enable click-through and restore it from the tray. This is a geometric region, not per-pixel alpha.
4. Drag between monitors with negative coordinates and different DPI (100%, 125%, 150%). Check no large jump, reachable placement, saved final location, taskbars on different edges, monitor unplug recovery, and reset.
5. Shorten inactivity thresholds, verify calm/sit/automatic sleep and wake using real system input; verify manual sleep stays asleep. Check that random activities cannot interrupt dragging/user actions.
6. Enable fullscreen pause, hide/show, pause/resume, reduced motion, and battery saver. Confirm the character resumes and click-through can still be restored. Turn off effects/Pip and confirm removal. Verify play returns to its resting position.
7. Change settings, restart, and verify persistence. Enable then disable startup explicitly and verify the sign-in entry. Close Settings without exiting the pet.
8. Install the generated per-user NSIS package on a Windows system with WebView2, launch it, quit, and uninstall. Check that no duplicate background worker remains. The 0.2.0 per-user installation has been run; uninstallation has not.

## Known limits

- The Windows source compiled and passed a focused launch check. Multi-monitor/fractional DPI, tray restoration of click-through, fullscreen/battery behavior, cold-start persistence, and uninstallation have not been manually verified. The 0.2.0 installer was run for the current user.
- Geometric regions may include a few transparent pixels and clip fast-moving artwork between 30 Hz updates (15 Hz on battery). Tiny effects are included in the native region so they remain visible.
- Fullscreen detection compares the foreground window bounds to its monitor; some borderless/maximized apps can be classified conservatively. Pause behavior is configurable.
- Hidden/fullscreen/paused rendering retains a low-frequency heartbeat. Memory and all-day CPU/GPU use are unmeasured.
- No installer signing, user-facing sprite importer, arbitrary application-window perching, or Live2D integration is configured.
- Stats persist periodically; abrupt termination can lose up to roughly 30 seconds of stats changes. Position saves only after explicit placement/reset, preserving the resting location during excursions.
