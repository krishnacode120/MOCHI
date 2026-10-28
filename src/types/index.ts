export type PetState = 'IDLE' | 'CURIOUS' | 'WALKING' | 'RUNNING' | 'CLIMBING' | 'EXPLORING' | 'HIDE_SEEK' | 'HOPSCOTCH' | 'MOVIE' | 'WRITING' | 'TELEPORTING' | 'FALLING' | 'HUGGING' | 'STORYTELLING' | 'WONDERING' | 'REASSEMBLING' | 'SUNBATHING' | 'COLLECTING' | 'TYPING' | 'WATCHING' | 'STRETCHING' | 'SITTING' | 'PLAYING' | 'SLEEPING' | 'WAKING' | 'WAVING' | 'JUMPING' | 'DANCING' | 'DRINKING_TEA' | 'DRAGGING' | 'PAUSED';
export type Action = 'pet' | 'tea' | 'play' | 'run' | 'climb' | 'explore' | 'hideSeek' | 'hop' | 'movie' | 'write' | 'teleport' | 'fall' | 'hug' | 'story' | 'wonder' | 'shuffle' | 'summer' | 'collect' | 'work' | 'watch' | 'stretch' | 'dance' | 'sleep' | 'wake' | 'pause' | 'resume' | 'outfit';
export interface Settings {
  character: 'mochi' | 'walle' | 'olaf'; climate: 'off' | 'auto' | 'sunny' | 'rain' | 'snow' | 'wind';
  size: number; outfit: 'lavender' | 'peach' | 'sky'; speed: number; sensitivity: number;
  pip: boolean; opacity: number; alwaysOnTop: boolean; reducedMotion: boolean;
  particles: number; theme: 'cream' | 'dusk'; autoSleep: boolean; randomActions: boolean;
  followCursor: boolean; interactions: boolean; quiet: boolean; stats: boolean;
  workAlong: boolean; adventures: boolean; fullScreenRoam: boolean;
  startup: boolean; clickThrough: boolean; monitor: number; fullscreenPause: boolean;
  batterySaver: boolean; muted: boolean; volume: number; calmAfter: number;
  sitAfter: number; sleepAfter: number; snapEdges: boolean; playRadius: number;
  waterReminders: boolean; waterInterval: number; stretchReminders: boolean; stretchInterval: number;
  eyeReminders: boolean; eyeInterval: number;
}
export interface Stats { happiness: number; energy: number; affection: number }
export interface CursorSample {
  x: number; y: number; localX: number; localY: number; velocity: number;
  stationaryMs: number; idleMs: number; fullscreen: boolean; battery: boolean; visible: boolean;
  typing: boolean;
}
export interface MovementBounds { left: number; right: number; top: number; bottom: number }
export interface WorkArea { name: string; x: number; y: number; width: number; height: number; scale: number }
export interface HitEllipse { rectangular?: boolean; x: number; y: number; width: number; height: number }
export interface Persisted { settings: Settings; stats: Stats; position: { x: number; y: number } | null }
