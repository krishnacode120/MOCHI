use crate::settings::Position;
use serde::Serialize;
use tauri::{AppHandle, Manager};
#[derive(Debug, Clone, Serialize)]
pub struct WorkArea {
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale: f64,
}
pub fn all(app: &AppHandle) -> Result<Vec<WorkArea>, String> {
    let window = app.get_webview_window("pet").ok_or("Pet window missing")?;
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    let primary = window.primary_monitor().map_err(|e| e.to_string())?;
    let mut result: Vec<_> = monitors
        .into_iter()
        .map(|m| {
            let area = m.work_area();
            WorkArea {
                name: m.name().cloned().unwrap_or_else(|| "Display".into()),
                x: area.position.x,
                y: area.position.y,
                width: area.size.width,
                height: area.size.height,
                scale: m.scale_factor(),
            }
        })
        .collect();
    if let Some(p) = primary {
        let area = p.work_area();
        if let Some(index) = result
            .iter()
            .position(|m| m.x == area.position.x && m.y == area.position.y)
        {
            result.swap(0, index);
        }
    }
    if result.is_empty() {
        return Err("Windows reported no monitors".into());
    }
    Ok(result)
}
pub fn nearest(areas: &[WorkArea], p: Position) -> &WorkArea {
    areas
        .iter()
        .min_by(|a, b| distance(a, p).total_cmp(&distance(b, p)))
        .expect("nonempty monitor list")
}
fn distance(a: &WorkArea, p: Position) -> f64 {
    let x = (p.x as f64).clamp(a.x as f64, a.x as f64 + a.width as f64);
    let y = (p.y as f64).clamp(a.y as f64, a.y as f64 + a.height as f64);
    (x - p.x as f64).powi(2) + (y - p.y as f64).powi(2)
}
pub fn clamp(p: Position, width: u32, height: u32, area: &WorkArea) -> Position {
    Position {
        x: p.x
            .clamp(area.x, area.x + area.width.saturating_sub(width) as i32),
        y: p.y
            .clamp(area.y, area.y + area.height.saturating_sub(height) as i32),
    }
}
pub fn corner(area: &WorkArea, size: f64) -> Position {
    Position {
        x: area.x + area.width as i32 - (320. * size * area.scale) as i32 - 12,
        y: area.y + area.height as i32 - (340. * size * area.scale) as i32,
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn negative_monitor_and_unplug_recovery() {
        let a = WorkArea {
            name: "left".into(),
            x: -1920,
            y: -100,
            width: 1920,
            height: 1080,
            scale: 1.5,
        };
        assert_eq!(
            clamp(Position { x: -3000, y: 1900 }, 480, 510, &a),
            Position { x: -1920, y: 470 }
        );
    }
}
