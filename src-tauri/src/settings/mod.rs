use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub size: f64,
    pub outfit: String,
    pub speed: f64,
    pub sensitivity: f64,
    pub pip: bool,
    pub opacity: f64,
    pub always_on_top: bool,
    pub reduced_motion: bool,
    pub particles: u32,
    pub theme: String,
    pub auto_sleep: bool,
    pub random_actions: bool,
    pub follow_cursor: bool,
    pub interactions: bool,
    pub quiet: bool,
    pub stats: bool,
    pub startup: bool,
    pub click_through: bool,
    pub monitor: usize,
    pub fullscreen_pause: bool,
    pub battery_saver: bool,
    pub muted: bool,
    pub volume: f64,
    pub calm_after: f64,
    pub sit_after: f64,
    pub sleep_after: f64,
    pub snap_edges: bool,
    pub play_radius: f64,
    pub water_reminders: bool,
    pub water_interval: f64,
    pub stretch_reminders: bool,
    pub stretch_interval: f64,
    pub eye_reminders: bool,
    pub eye_interval: f64,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            size: 1.,
            outfit: "lavender".into(),
            speed: 1.,
            sensitivity: 1.,
            pip: true,
            opacity: 1.,
            always_on_top: true,
            reduced_motion: false,
            particles: 18,
            theme: "cream".into(),
            auto_sleep: true,
            random_actions: true,
            follow_cursor: true,
            interactions: true,
            quiet: false,
            stats: true,
            startup: false,
            click_through: false,
            monitor: 0,
            fullscreen_pause: true,
            battery_saver: false,
            muted: true,
            volume: 0.2,
            calm_after: 30.,
            sit_after: 120.,
            sleep_after: 300.,
            snap_edges: true,
            play_radius: 180.,
            water_reminders: true,
            water_interval: 45.,
            stretch_reminders: false,
            stretch_interval: 60.,
            eye_reminders: false,
            eye_interval: 30.,
        }
    }
}
fn bounded(value: &mut f64, min: f64, max: f64, fallback: f64) {
    *value = if value.is_finite() {
        value.clamp(min, max)
    } else {
        fallback
    };
}
impl Settings {
    pub fn validate(&mut self) {
        bounded(&mut self.size, 0.65, 1.6, 1.);
        bounded(&mut self.speed, 0.5, 1.8, 1.);
        bounded(&mut self.sensitivity, 0.3, 2., 1.);
        bounded(&mut self.opacity, 0.3, 1., 1.);
        bounded(&mut self.volume, 0., 1., 0.2);
        bounded(&mut self.calm_after, 10., 600., 30.);
        bounded(&mut self.sit_after, 30., 1800., 120.);
        bounded(&mut self.sleep_after, 60., 7200., 300.);
        bounded(&mut self.play_radius, 30., 400., 180.);
        bounded(&mut self.water_interval, 10., 240., 45.);
        bounded(&mut self.stretch_interval, 10., 240., 60.);
        bounded(&mut self.eye_interval, 10., 240., 30.);
        self.sit_after = self.sit_after.max(self.calm_after);
        self.sleep_after = self.sleep_after.max(self.sit_after);
        self.particles = self.particles.min(32);
        self.monitor = self.monitor.min(32);
        if !["lavender", "peach", "sky"].contains(&self.outfit.as_str()) {
            self.outfit = "lavender".into();
        }
        if !["cream", "dusk"].contains(&self.theme.as_str()) {
            self.theme = "cream".into();
        }
    }
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Stats {
    pub happiness: f64,
    pub energy: f64,
    pub affection: f64,
}
impl Default for Stats {
    fn default() -> Self {
        Self {
            happiness: 75.,
            energy: 80.,
            affection: 50.,
        }
    }
}
impl Stats {
    pub fn validate(&mut self) {
        bounded(&mut self.happiness, 0., 100., 75.);
        bounded(&mut self.energy, 0., 100., 80.);
        bounded(&mut self.affection, 0., 100., 50.);
    }
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Persisted {
    pub settings: Settings,
    pub stats: Stats,
    pub position: Option<Position>,
}
pub struct Config {
    pub data: Mutex<Persisted>,
    pub path: PathBuf,
    pub io: Mutex<()>,
}
impl Config {
    pub fn load(app: &AppHandle) -> Result<Self, String> {
        let path = app
            .path()
            .app_config_dir()
            .map_err(|e| e.to_string())?
            .join("settings.json");
        let data = match fs::read_to_string(&path) {
            Ok(text) => match serde_json::from_str::<Persisted>(&text) {
                Ok(mut data) => {
                    data.settings.validate();
                    data.stats.validate();
                    data
                }
                Err(e) => {
                    let backup = path.with_extension("invalid.json");
                    fs::copy(&path, &backup)
                        .map_err(|io| format!("Cannot preserve invalid settings: {io}; {e}"))?;
                    Persisted::default()
                }
            },
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Persisted::default(),
            Err(e) => return Err(e.to_string()),
        };
        Ok(Self {
            data: Mutex::new(data),
            path,
            io: Mutex::new(()),
        })
    }
    pub fn snapshot(&self) -> Persisted {
        self.data.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }
    pub fn write(&self) -> Result<(), String> {
        let _io = self.io.lock().map_err(|e| e.to_string())?;
        let data = self.snapshot();
        let dir = self.path.parent().ok_or("Invalid config path")?;
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        let temp = self.path.with_extension("tmp");
        let bytes = serde_json::to_vec_pretty(&data).map_err(|e| e.to_string())?;
        use std::io::Write;
        let mut file = fs::File::create(&temp).map_err(|e| e.to_string())?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|e| e.to_string())?;
        drop(file);
        // MoveFileExW replaces atomically on Windows; no remove-then-rename gap.
        super::platform::replace_file(&temp, &self.path)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_untrusted_settings() {
        let mut s = Settings {
            size: f64::NAN,
            sleep_after: -4.,
            sit_after: 180.,
            outfit: "bad".into(),
            ..Default::default()
        };
        s.validate();
        assert_eq!(s.size, 1.);
        assert_eq!(s.sleep_after, 180.);
        assert_eq!(s.outfit, "lavender");
    }
    #[test]
    fn persistence_roundtrip() {
        let p = Persisted {
            position: Some(Position { x: -1400, y: 20 }),
            ..Default::default()
        };
        let decoded: Persisted = serde_json::from_str(&serde_json::to_string(&p).unwrap()).unwrap();
        assert_eq!(decoded.position, p.position);
    }
}
