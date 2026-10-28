# Animation system

`characters/mochi/artwork.ts` constructs original vector layers: hoodie body, head, eyes/pupils/lids, mouth, hair, arms, legs, teacup, and shadow. The same design is supplied as `public/mochi.svg` for the native settings portrait; the desktop character itself is rendered and articulated by PixiJS. `scripts/generate-icons.ps1` generates original tray/application icons without external artwork.

`PetMachine` has IDLE, CURIOUS, WALKING, RUNNING, CLIMBING, EXPLORING, HIDE_SEEK, HOPSCOTCH, TYPING, WATCHING, STRETCHING, SITTING, PLAYING, SLEEPING, WAKING, WAVING, JUMPING, DANCING, DRINKING_TEA, DRAGGING, and PAUSED. Requests have idle/system/user sources. Idle requests only interrupt safe resting states and use per-action cooldowns. User animations resist idle sleep requests. Drag blocks all transitions except release and pause. Pausing remembers sleep or idle as a safe return state. A bounded one-slot queue lets an action requested while asleep finish waking first; the newest user request during waking replaces the pending action. Dragging/pause clear that queue.

The animation clock does not advance while paused, hidden, or paused for a fullscreen app. GSAP transitions use the configured speed. `Animator` kills an interrupted timeline and blends from the current pose; sleep/wake interpolates from the current sleep pose. Rendering interpolates gaze toward global cursor samples and limits pupil movement/tilt. Walking alternates limbs; sitting lowers the body and swings feet; a jump has anticipation, ascent, landing squash, and recovery. Tea lifts a separate cup and fades steam. Pip floats, settles next to a sleeping or working Mochi, and follows an orbit during play. All follow interpolation uses delta time. Typing reveals a vector laptop and alternating hand taps with decorative screen strokes. Watching tilts the head; stretching reaches both arms upward.

The behavior scheduler uses injected randomness in tests, a 22–48 second spontaneous interval, no immediate repeated idle actions, and configurable 30/120/300 second calm/sit/sleep defaults. Manual sleep remains asleep until an explicit user wake or interaction. Windows system inactivity drives automatic sleep; browser preview uses only synthetic local pointer activity and is labeled accordingly.

Statistics change gently after successful interactions. Sleep restores one energy point per ten active animation-clock seconds; there is no decay, death, debt, notification pressure, or offline-time penalty. Stats save every 30 seconds, so abrupt process termination may lose the most recent interactions.

Effects include hearts, four-point sparkles, stars, bubbles, sleep strokes, butterflies, and dust. A fixed pool and active-count setting bound allocations. Saver, quiet, or reduced-motion modes clear effects. The scene is capped at 60 FPS normally and 30 in saver/reduced motion. Native shaped regions use articulated bounds rather than a full rectangular canvas; quick movements can clip at the 30 Hz region boundary (15 Hz on battery) until the next update. Verify this on Windows before release.

Future bitmap assets can use `loadCharacterAsset` in `characters/assets.ts`. It loads local PNG layers or an explicit spritesheet animation and returns a display tree. This is an extension interface; v0.1 does not expose an import button. Callers retain responsibility for releasing cached textures when retiring custom characters.

## Companion routes and activity

`physics/adventures.ts` produces eased absolute offsets from home. Walking and Pip play stay near home. Running and hopscotch can use the full screen width. EXPLORING visits the monitor corners with an original balloon rig; full-screen roaming can be disabled. Climbing approaches the nearest monitor edge, shifts the rig toward the wall, climbs within available height, descends, and returns. Native bounds are logical offsets converted from the monitor work area using pet size and DPI; native movement clamps again before setting the window position. Interrupted trips ease home; dragging establishes a new home. Bounds requests are generation-guarded against stale responses.

Action age accumulates delta time at the current speed instead of multiplying total elapsed time, preventing rewinds when speed changes. Body, limbs, gaze, facing, and Pip use exponential smoothing. Native movement has one request in flight, capped at 60 Hz (30 on battery).

The Windows adapter receives keyboard-event notifications on a dedicated message-loop thread. The callback never dereferences the key-data pointer: it only flips an activity boolean on key-down and always forwards the event. No key identity or text is read or retained. Turning off typing reactions removes the observer. The cursor worker retains only the last active instant, with a 1.2-second hold, and skips sampling when disabled, quiet, hidden, paused, or fullscreen. The behavior scheduler starts typing only from resting states and respects user actions, manual sleep, and dragging. Automatic typing ends after a short inactivity grace period and has an 18-second start cooldown. Browser preview uses a local keydown activity flag only.

## Animation research applied (28 October 2026)

- [University of Washington: animation principles](https://courses.cs.washington.edu/courses/cse458/25au/content/exercises/animation_principles.html): anticipation, arcs, and overlapping action informed the small pre-movement squash, curved balloon routes, staggered hair response, and balloon sway. Artwork remains original; no third-party sprites were copied.
- [GSAP easing documentation](https://gsap.com/docs/v3/Eases/): slow-in/slow-out timing informed the eased starts, stops, and pose transitions. Routes are pure smoothstep functions, while articulated pose transitions use GSAP.
- [Microsoft LowLevelKeyboardProc](https://learn.microsoft.com/en-us/windows/win32/winmsg/lowlevelkeyboardproc): replaced key-state polling with an activity-only callback on a dedicated message-loop thread. It performs one atomic store and always calls the next hook. No key-event payload is dereferenced. This follows the documented requirement to keep the callback short and run it on a thread with a message loop.

Hide-and-seek has approach, hide, two peeks, reveal, and return phases. The canvas clips artwork at the screen edge; native hit regions are intersected with the canvas before submission. Pip or a visible portion of Mochi remains nearby, and the tray retains reset/exit controls. Clicking Mochi interrupts hiding with a wave and eases the trip home. Quiet/reduced-motion modes suppress travel and peeking. Returning from an interrupted full-screen trip is speed-limited to avoid jumping across the desktop.

A normal monitor work area is used, excluding the taskbar. This release explores the current monitor, not the entire multi-monitor virtual desktop. No application-window contents are inspected.

## Character and scene update (0.5)

`createCharacter.ts` shares an articulated rig across Mochi, WALL-E, and Olaf, with distinct vector geometry, eye spacing, limb shapes, and original props. Character choices persist with validated settings. Olaf adds scripted hugs, storytelling, short original thoughts, detachable body/nose choreography, summer posing, and a waddle. WALL-E adds a plant-collecting pose. No content or emotional analysis is performed.

Blanket/pillow and moon/star work already present in the workspace was preserved and integrated. Desk, notebook, popcorn, cola, plant, and captions fade in and out independently. Rectangular native regions preserve robot, desk, and caption corners; other character envelopes remain elliptical. Region submission is clipped to the canvas and bounded at 64 parts.

MOVIE is an explicit persistent action, toggleable from controls. It bypasses fullscreen animation suspension, while hidden windows still suspend. It prevents automatic sleep and spontaneous action interruptions until the user ends or changes the action. Keyboard activity and reminders still respect their fullscreen suppression.

TELEPORTING uses discrete in-bounds destinations with brief fade-outs; the scene stays invisible while the native position update is in flight. FALLING uses acceleration, a rebound, and an eased recovery. Both honor reduced-motion and quiet travel suppression.

`Climate.ts` provides pooled, decorative sun/rain/snow/wind scenes. Automatic cycling uses active renderer time, never location or forecast data. Sleep hides climate effects in favor of the moon/stars, and quiet mode hides them.
