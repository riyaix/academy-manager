mod backup;
mod db;
mod logo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db::DATABASE_CONNECTION, db::migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            backup::create_backup_archive,
            backup::inspect_backup_archive,
            backup::restore_backup_archive,
            logo::write_logo_png,
            logo::read_logo_png,
            logo::delete_logo_png,
            db::transaction::run_sql_transaction,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
