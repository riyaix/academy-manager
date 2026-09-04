use std::fs;
use std::path::PathBuf;

use tauri::path::BaseDirectory;
use tauri::Manager;

pub const LOGO_FILE_NAME: &str = "logo.png";

fn resolve_logo_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve(LOGO_FILE_NAME, BaseDirectory::AppConfig)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn write_logo_png(app: tauri::AppHandle, png_bytes: Vec<u8>) -> Result<(), String> {
    if png_bytes.is_empty() {
        return Err("Logo image is empty.".to_string());
    }

    let logo_path = resolve_logo_path(&app)?;
    if let Some(parent) = logo_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&logo_path, png_bytes).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn read_logo_png(app: tauri::AppHandle) -> Result<Option<Vec<u8>>, String> {
    let logo_path = resolve_logo_path(&app)?;
    if !logo_path.exists() {
        return Ok(None);
    }

    let bytes = fs::read(&logo_path).map_err(|error| error.to_string())?;
    if bytes.is_empty() {
        return Ok(None);
    }

    Ok(Some(bytes))
}

#[tauri::command]
pub fn delete_logo_png(app: tauri::AppHandle) -> Result<(), String> {
    let logo_path = resolve_logo_path(&app)?;
    if logo_path.exists() {
        fs::remove_file(&logo_path).map_err(|error| error.to_string())?;
    }
    Ok(())
}
