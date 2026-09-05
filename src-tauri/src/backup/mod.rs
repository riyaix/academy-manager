use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::path::BaseDirectory;
use tauri::Manager;
use zip::read::ZipArchive;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

const DB_FILE_NAME: &str = "academy-manager.db";
const METADATA_FILE: &str = "metadata.json";
const LOGO_FILE: &str = "logo.png";

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupMetadata {
    pub format_version: u32,
    pub product: String,
    pub app_version: String,
    pub schema_version: u32,
    pub exported_at: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBackupArchiveRequest {
    pub destination_path: String,
    pub metadata_json: String,
    pub logo_png_bytes: Option<Vec<u8>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInspection {
    pub metadata: BackupMetadata,
    pub has_logo: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupResult {
    pub metadata: BackupMetadata,
    pub logo_png_bytes: Option<Vec<u8>>,
}

fn resolve_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .resolve(DB_FILE_NAME, BaseDirectory::AppConfig)
        .map_err(|error| error.to_string())
}

fn read_archive_entries(path: &Path) -> Result<HashMap<String, Vec<u8>>, String> {
    let file = File::open(path).map_err(|error| error.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|error| error.to_string())?;
    let mut entries = HashMap::new();

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| error.to_string())?;
        if entry.is_dir() {
            continue;
        }

        let name = entry.name().to_string();
        let mut buffer = Vec::new();
        entry
            .read_to_end(&mut buffer)
            .map_err(|error| error.to_string())?;
        entries.insert(name, buffer);
    }

    Ok(entries)
}

fn inspect_entries(entries: &HashMap<String, Vec<u8>>) -> Result<BackupInspection, String> {
    let metadata_bytes = entries
        .get(METADATA_FILE)
        .ok_or_else(|| "metadata.json is missing from backup.".to_string())?;

    let metadata: BackupMetadata =
        serde_json::from_slice(metadata_bytes).map_err(|error| error.to_string())?;

    if metadata.product != "academy-manager" {
        return Err("Backup is not an Academy Manager archive.".to_string());
    }

    if !entries.contains_key(DB_FILE_NAME) {
        return Err("academy-manager.db is missing from backup.".to_string());
    }

    Ok(BackupInspection {
        metadata,
        has_logo: entries.contains_key(LOGO_FILE),
    })
}

fn remove_sqlite_sidecars(db_path: &Path) {
    let path = db_path.to_string_lossy();
    let _ = fs::remove_file(format!("{path}-wal"));
    let _ = fs::remove_file(format!("{path}-shm"));
}

#[tauri::command]
pub fn create_backup_archive(
    app: tauri::AppHandle,
    request: CreateBackupArchiveRequest,
) -> Result<String, String> {
    let db_path = resolve_db_path(&app)?;

    if !db_path.exists() {
        return Err("Database file not found.".to_string());
    }

    let destination = Path::new(&request.destination_path);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let archive_file = File::create(destination).map_err(|error| error.to_string())?;
    let mut zip = ZipWriter::new(archive_file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let db_bytes = fs::read(&db_path).map_err(|error| error.to_string())?;
    zip.start_file(DB_FILE_NAME, options)
        .map_err(|error| error.to_string())?;
    zip.write_all(&db_bytes).map_err(|error| error.to_string())?;

    zip.start_file(METADATA_FILE, options)
        .map_err(|error| error.to_string())?;
    zip.write_all(request.metadata_json.as_bytes())
        .map_err(|error| error.to_string())?;

    if let Some(logo_bytes) = request.logo_png_bytes {
        if !logo_bytes.is_empty() {
            zip.start_file(LOGO_FILE, options)
                .map_err(|error| error.to_string())?;
            zip.write_all(&logo_bytes).map_err(|error| error.to_string())?;
        }
    }

    zip.finish().map_err(|error| error.to_string())?;

    Ok(request.destination_path)
}

#[tauri::command]
pub fn inspect_backup_archive(source_path: String) -> Result<BackupInspection, String> {
    let entries = read_archive_entries(Path::new(&source_path))?;
    inspect_entries(&entries)
}

#[tauri::command]
pub fn restore_backup_archive(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<RestoreBackupResult, String> {
    let entries = read_archive_entries(Path::new(&source_path))?;
    let inspection = inspect_entries(&entries)?;

    let db_bytes = entries
        .get(DB_FILE_NAME)
        .ok_or_else(|| "academy-manager.db is missing from backup.".to_string())?;

    let db_path = resolve_db_path(&app)?;
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    remove_sqlite_sidecars(&db_path);
    fs::write(&db_path, db_bytes).map_err(|error| error.to_string())?;

    let logo_png_bytes = entries
        .get(LOGO_FILE)
        .cloned()
        .filter(|bytes| !bytes.is_empty());

    Ok(RestoreBackupResult {
        metadata: inspection.metadata,
        logo_png_bytes,
    })
}
