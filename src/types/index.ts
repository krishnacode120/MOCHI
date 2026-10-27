export type PetState = 'IDLE' | 'CURIOUS' | 'WALKING' | 'SITTING' | 'PLAYING' | 'SLEEPING' | 'WAKING' | 'WAVING' | 'JUMPING' | 'DANCING' | 'DRINKING_TEA' | 'DRAGGING' | 'PAUSED';
export type Action = 'pet' | 'tea' | 'play' | 'dance' | 'sleep' | 'wake' | 'pause' | 'resume' | 'outfit';
export interface Settings {
  size: number; outfit: 'lavender' | 'peach' | 'sky'; speed: number; sensitivity: number;
  pip: boolean; opacity: number; alwaysOnTop: boolean; reducedMotion: boolean;
  particles: number; theme: 'cream' | 'dusk'; autoSleep: boolean; randomActions: boolean;
  followCursor: boolean; interactions: boolean; quiet: boolean; stats: boolean;
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
}
export interface WorkArea { name: string; x: number; y: number; width: number; height: number; scale: number }
export interface HitEllipse { x: number; y: number; width: number; height: number }
export interface Persisted { settings: Settings; stats: Stats; position: { x: number; y: number } | null }
