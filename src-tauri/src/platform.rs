//! All unsafe platform calls are confined to this adapter. Coordinates are physical pixels.
use crate::{desktop::HitEllipse, settings::Position};
use std::path::Path;
use tauri::WebviewWindow;
#[cfg(windows)]
mod win {
    use super::*;
    use windows::{
        core::PCWSTR,
        Win32::{
            Foundation::{HWND, POINT, RECT},
            Graphics::Gdi::{
                CombineRgn, CreateEllipticRgn, CreateRectRgn, DeleteObject, GetMonitorInfoW,
                MonitorFromWindow, SetWindowRgn, MONITORINFO, MONITOR_DEFAULTTONEAREST, RGN_OR,
            },
            Storage::FileSystem::{MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH},
            System::{
                Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS},
                SystemInformation::GetTickCount,
            },
            UI::{
                Input::KeyboardAndMouse::{
                    GetAsyncKeyState, GetLastInputInfo, LASTINPUTINFO, VK_LBUTTON,
                },
                WindowsAndMessaging::{
                    GetCursorPos, GetDesktopWindow, GetForegroundWindow, GetShellWindow,
                    GetWindowRect, MessageBoxW, MB_ICONERROR, MB_OK,
                },
            },
        },
    };
    pub fn cursor() -> Result<Position, String> {
        unsafe {
            let mut p = POINT::default();
            GetCursorPos(&mut p).map_err(|e| e.to_string())?;
            Ok(Position { x: p.x, y: p.y })
        }
    }
    pub fn show_error(message: &str) {
        let text: Vec<u16> = message.encode_utf16().chain(Some(0)).collect();
        let title: Vec<u16> = "Mochi could not start"
            .encode_utf16()
            .chain(Some(0))
            .collect();
        unsafe {
            MessageBoxW(
                None,
                PCWSTR(text.as_ptr()),
                PCWSTR(title.as_ptr()),
                MB_OK | MB_ICONERROR,
            );
        }
    }
    pub fn left_down() -> bool {
        unsafe { GetAsyncKeyState(VK_LBUTTON.0 as i32) < 0 }
    }
    pub fn idle_ms() -> Result<u64, String> {
        unsafe {
            let mut input = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            if !GetLastInputInfo(&mut input).as_bool() {
                return Err("GetLastInputInfo failed".into());
            }
            Ok(GetTickCount().wrapping_sub(input.dwTime) as u64)
        }
    }
    pub fn battery() -> bool {
        unsafe {
            let mut s = SYSTEM_POWER_STATUS::default();
            GetSystemPowerStatus(&mut s).is_ok() && s.ACLineStatus == 0 && s.BatteryFlag != 128
        }
    }
    pub fn fullscreen(pet: &WebviewWindow) -> bool {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null()
                || hwnd == GetDesktopWindow()
                || hwnd == GetShellWindow()
                || pet.hwnd().map(|h| h.0 == hwnd.0).unwrap_or(false)
            {
                return false;
            }
            let mut rect = RECT::default();
            if GetWindowRect(hwnd, &mut rect).is_err() {
                return false;
            }
            let mut info = MONITORINFO {
                cbSize: std::mem::size_of::<MONITORINFO>() as u32,
                ..Default::default()
            };
            if !GetMonitorInfoW(MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST), &mut info)
                .as_bool()
            {
                return false;
            }
            rect.left <= info.rcMonitor.left
                && rect.top <= info.rcMonitor.top
                && rect.right >= info.rcMonitor.right
                && rect.bottom >= info.rcMonitor.bottom
        }
    }
    pub fn region(
        window: &WebviewWindow,
        ellipses: &[HitEllipse],
        scale: f64,
    ) -> Result<(), String> {
        unsafe {
            let hwnd = HWND(window.hwnd().map_err(|e| e.to_string())?.0);
            let combined = CreateRectRgn(0, 0, 0, 0);
            if combined.0.is_null() {
                return Err("Could not allocate Windows hit region".into());
            }
            for e in ellipses {
                let part = CreateEllipticRgn(
                    (e.x * scale).floor() as i32,
                    (e.y * scale).floor() as i32,
                    ((e.x + e.width) * scale).ceil() as i32,
                    ((e.y + e.height) * scale).ceil() as i32,
                );
                if part.0.is_null() {
                    let _ = DeleteObject(combined.into());
                    return Err("Could not allocate character region".into());
                }
                let result = CombineRgn(Some(combined), Some(combined), Some(part), RGN_OR);
                let _ = DeleteObject(part.into());
                if result.0 == 0 {
                    let _ = DeleteObject(combined.into());
                    return Err("Could not combine character regions".into());
                }
            }
            // Windows takes ownership of combined only on success.
            if SetWindowRgn(hwnd, Some(combined), true) == 0 {
                let _ = DeleteObject(combined.into());
                return Err("Could not apply character hit region".into());
            }
            Ok(())
        }
    }
    pub fn replace_file(from: &Path, to: &Path) -> Result<(), String> {
        use std::os::windows::ffi::OsStrExt;
        let from: Vec<u16> = from.as_os_str().encode_wide().chain(Some(0)).collect();
        let to: Vec<u16> = to.as_os_str().encode_wide().chain(Some(0)).collect();
        unsafe {
            MoveFileExW(
                PCWSTR(from.as_ptr()),
                PCWSTR(to.as_ptr()),
                MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
            )
            .map_err(|e| e.to_string())
        }
    }
}
#[cfg(windows)]
pub use win::*;
#[cfg(not(windows))]
compile_error!(
    "Native Mochi currently supports Windows only. Use npm run dev for a browser preview."
);
