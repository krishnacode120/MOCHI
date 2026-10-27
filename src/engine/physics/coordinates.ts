import type { WorkArea } from '../../types';
export const toLocal = (cursor: number, origin: number, dpi: number, size: number) => (cursor - origin) / (dpi * size);
export function clampPosition(x: number, y: number, width: number, height: number, area: WorkArea) {
  return { x: Math.round(Math.max(area.x, Math.min(x, area.x + Math.max(0, area.width - width)))), y: Math.round(Math.max(area.y, Math.min(y, area.y + Math.max(0, area.height - height)))) };
}
