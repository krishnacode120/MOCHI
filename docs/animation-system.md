# Animation system

`characters/mochi/artwork.ts` constructs original vector layers: hoodie body, head, eyes/pupils/lids, mouth, hair, arms, legs, teacup, and shadow. Settings renders a static frame of the same PixiJS character rig used by the desktop pet; the legacy SVG previews remain in public/. `scripts/generate-icons.ps1` generates original tray/application icons without external artwork.

`PetMachine` has IDLE, CURIOUS, WALKING, RUNNING, CLIMBING, EXPLORING, HIDE_SEEK, HOPSCOTCH, TYPING, WATCHING, STRETCHING, SITTING, PLAYING, SLEEPING, WAKING, WAVING, JUMPING, DANCING, DRINKING_TEA, DRAGGING, and PAUSED. Requests have idle/system/user sources. Idle requests only interrupt safe resting states and use per-action cooldowns. User animations resist idle sleep requests. Drag blocks all transitions except release and pause. Pausing remembers sleep or idle as a safe return state. A bounded one-slot queue lets an action requested while asleep finish waking first; the newest user request during waking replaces the pending action. Dragging/pause clear that queue.

The animation clock does not advance while paused, hidden, or paused for a fullscreen app. `Animator` samples pose targets from state-machine action age at the configured speed and blends from the current pose. Sleep/wake interpolates from the current sleep pose. Rendering interpolates gaze toward global cursor samples and limits pupil movement/tilt. Walking alternates limbs; sitting lowers the body and swings feet; a jump has anticipation, ascent, landing squash, and recovery. Tea lifts a separate cup and fades steam. Pip floats, settles next to a sleeping or working Mochi, and follows an orbit during play. All follow interpolation uses delta time. Typing reveals a vector laptop and alternating hand taps with decorative screen strokes. Watching tilts the head; stretching reaches both arms upward.

The behavior scheduler uses injected randomness in tests, a 22–48 second spontaneous interval, no repeats among the previous three spontaneous choices, and configurable 30/120/300 second calm/sit/sleep defaults. Manual sleep remains asleep until an explicit user wake or interaction. Windows system inactivity drives automatic sleep; browser preview uses only synthetic local pointer activity and is labeled accordingly.

Statistics change gently after successful interactions. Sleep restores one energy point per ten active animation-clock seconds; there is no decay, death, debt, notification pressure, or offline-time penalty. Stats save every 30 seconds, so abrupt process termination may lose the most recent interactions.

Effects include hearts, four-point sparkles, stars, bubbles, sleep strokes, butterflies, and dust. A fixed pool and active-count setting bound allocations. Saver, quiet, or reduced-motion modes clear effects. The scene is capped at 60 FPS normally and 30 in saver/reduced motion. Native shaped regions use articulated bounds rather than a full rectangular canvas; quick movements can clip at the 30 Hz region boundary (15 Hz on battery) until the next update. Verify this on Windows before release.

Future bitmap assets can use `loadCharacterAsset` in `characters/assets.ts`. It loads local PNG layers or an explicit spritesheet animation and returns a display tree. This is an extension interface; v0.1 does not expose an import button. Callers retain responsibility for releasing cached textures when retiring custom characters.

## Companion routes and activity

`physics/adventures.ts` produces eased absolute offsets from home. Walking stays near home; Pip play can use the full available width. Running and hopscotch can use the full screen width. EXPLORING visits the monitor corners with an original balloon rig; full-screen roaming can be disabled. Climbing approaches the nearest monitor edge, shifts the rig toward the wall, climbs within available height, descends, and returns. Native bounds are logical offsets converted from the monitor work area using pet size and DPI; native movement clamps again before setting the window position. Interrupted trips ease home; dragging establishes a new home. Bounds requests are generation-guarded against stale responses.

Action age accumulates delta time at the current speed instead of multiplying total elapsed time, preventing rewinds when speed changes. Body, limbs, gaze, facing, and Pip use exponential smoothing. Native movement has one request in flight, capped at 60 Hz (30 on battery).

The Windows adapter receives keyboard-event notifications on a dedicated message-loop thread. The callback never dereferences the key-data pointer: it only flips an activity boolean on key-down and always forwards the event. No key identity or text is read or retained. Turning off typing reactions removes the observer. The cursor worker retains only the last active instant, with a 1.2-second hold, and skips sampling when disabled, quiet, hidden, paused, or fullscreen. The behavior scheduler starts typing only from resting states and respects user actions, manual sleep, and dragging. Automatic typing ends after a short inactivity grace period and has an 18-second start cooldown. Browser preview uses a local keydown activity flag only.

## Animation research applied (28 October 2026)

- [University of Washington: animation principles](https://courses.cs.washington.edu/courses/cse458/25au/content/exercises/animation_principles.html): anticipation, arcs, and overlapping action informed the small pre-movement squash, curved balloon routes, staggered hair response, and balloon sway. Artwork remains original; no third-party sprites were copied.
- [GSAP easing documentation](https://gsap.com/docs/v3/Eases/): slow-in/slow-out timing informed the eased starts, stops, and pose transitions. Routes are pure smoothstep functions, while 0.6 articulated poses use action-age curves and exponential blending.
- [Microsoft LowLevelKeyboardProc](https://learn.microsoft.com/en-us/windows/win32/winmsg/lowlevelkeyboardproc): replaced key-state polling with an activity-only callback on a dedicated message-loop thread. It performs one atomic store and always calls the next hook. No key-event payload is dereferenced. This follows the documented requirement to keep the callback short and run it on a thread with a message loop.

Hide-and-seek has approach, hide, two peeks, reveal, and return phases. The canvas clips artwork at the screen edge; native hit regions are intersected with the canvas before submission. Pip or a visible portion of Mochi remains nearby, and the tray retains reset/exit controls. Clicking Mochi interrupts hiding with a wave and eases the trip home. Quiet/reduced-motion modes suppress travel and peeking. Returning from an interrupted full-screen trip is speed-limited to avoid jumping across the desktop.

A normal monitor work area is used, excluding the taskbar. This release explores the current monitor, not the entire multi-monitor virtual desktop. No application-window contents are inspected.

## Character and scene update (0.5)

`createCharacter.ts` shares an articulated rig across Mochi, WALL-E, and Olaf, with distinct vector geometry, eye spacing, limb shapes, and original props. Character choices persist with validated settings. Olaf adds scripted hugs, storytelling, short original thoughts, detachable body/nose choreography, summer posing, and a waddle. WALL-E adds a plant-collecting pose. No content or emotional analysis is performed.

Blanket/pillow and moon/star work already present in the workspace was preserved and integrated. Desk, notebook, popcorn, cola, plant, and captions fade in and out independently. Rectangular native regions preserve robot, desk, and caption corners; other character envelopes remain elliptical. Region submission is clipped to the canvas and bounded at 64 parts.

MOVIE is an explicit persistent action, toggleable from controls. It bypasses fullscreen animation suspension, while hidden windows still suspend. It prevents automatic sleep and spontaneous action interruptions until the user ends or changes the action. Keyboard activity and reminders still respect their fullscreen suppression.

TELEPORTING uses discrete in-bounds destinations with brief fade-outs; the scene stays invisible while the native position update is in flight. FALLING is driven by native gravity and drag-release velocity, followed by a distinct LANDING state. Falls save their destination instead of returning home. Both honor reduced-motion and quiet travel suppression.

`Climate.ts` provides pooled, decorative sun/rain/snow/wind scenes. Automatic cycling uses active renderer time, never location or forecast data. Sleep hides climate effects in favor of the moon/stars, and quiet mode hides them.

## Character motion revision (0.6)

`characters/artwork.ts` owns each character silhouette and articulated attachments. `signature.ts` builds and animates signature props. `profiles.ts` owns names, descriptions, signature actions, and the weighted spontaneous-action pool. The Settings portrait renders the actual rig once, without starting a second behavior loop or native window movement.

`animation/timing.ts` samples gesture curves from the state machine action age. Animator no longer creates an independent GSAP timeline: speed changes, suspension, and action completion stay synchronized. Cubes, webs, meat, solar panels, mask effects, and extended fists are included in native window regions. Non-Mochi artwork uses rectangular envelopes to preserve angular silhouettes.

WALL-E retains rigid treads and chassis, with gaze inside each independently tilting binocular housing. Spider-Man has no exposed pupils or mouth. Luffy stretches one arm through anticipation, extension, hold, and recovery. Signature poses use entrance/exit envelopes and reset inherited transforms. Shared blanket, desk, movie, and weather scenes remain available.

Random scheduling avoids the last three selected activities, resets its history when the character changes, and excludes other characters' signature actions. Switching characters clears pending actions, preserving a paused state when necessary. Browser routes and native routes remain bounded to the current monitor work area.

## Full-area adventures (0.6.1)

Web swinging and Gum-Gum rocket routes visit both side boundaries and the desktop floor, with arcs reaching the upper work-area boundary. Pip play uses the full width when full-screen roaming is enabled; its duration increased to 18 seconds. Small-adventure mode constrains swing, rocket, and play routes to the configured radius.

Ceiling patrol approaches a wall, climbs up, traverses the upper edge inverted, descends the opposite wall, and returns home. The rig centers before rotating and briefly scales with its actual angle to avoid clipping. Like wall climbing, ceiling patrol seeks the actual monitor sides. WALL-E's treasure patrol visits both floor edges and pauses twice to inspect an object.

The new trips use the existing native work-area clamp, serialized movement, interruption recovery, and reduced-motion/quiet suppression. The Behavior page's Explore the desktop button chooses the selected character's route. No application content is accessed.


## Weather wardrobe (0.6.2)

`weatherMode` resolves both particles and clothing from the same elapsed active-time value. `characters/weather.ts` allocates reusable umbrella, sunglasses, scarf, and scarf-tail graphics for each character. Attachments follow the head/rig and are included in native input/visual regions. Weather changes blend opacity; unsafe travel states stow props immediately before the pose rotates or exits the canvas. Reduced motion leaves clothing visible but removes flutter and shivers. This remains offline decorative weather.


## Shimeji-inspired foundation (0.6.4)

`characters/proportions.ts` defines compact body/leg proportions and larger heads per character, preserving WALL-E’s rigid treads. `animation/contacts.ts` anchors visible feet to a resting baseline and then the work-area floor, fits climbing poses within the canvas, and aligns wall hands / inverted feet. This is still procedural vector animation; no external sprite sheets or XML behavior files are loaded.

The native cursor worker samples drag velocity, applies elapsed-time gravity, limits throw speed and rebounds at the current monitor’s sides/ceiling. At the work-area floor it emits a landing event and saves the final position. No application-window collision or platform detection is implemented. Automatic behavior and reminders yield during falls and landing. Pause/hidden/fullscreen suppression freezes gravity; reduced motion and quiet mode finish without a physical throw. The renderer uses native falling/landed events rather than an idle reset on release, avoiding cancellation of a newly started fall. LANDING compresses and settles the pose for 900 ms; WALL-E retains rigid chassis proportions.

This release has no automated tests or UI/visual checks, at the user’s request. Runtime smoothness, cross-monitor dragging, DPI changes and all character/action combinations remain unverified.
