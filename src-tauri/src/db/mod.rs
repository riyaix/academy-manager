use tauri_plugin_sql::{Migration, MigrationKind};

pub mod transaction;

pub const DATABASE_CONNECTION: &str = "sqlite:facturador.db";

const MIGRATION_FILES: &[(&str, i64, &str)] = &[
    (
        // Description must stay stable — sqlx stores it; checksum is over SQL only.
        "initial_schema",
        1,
        include_str!("migrations/001_initial_schema.sql"),
    ),
    (
        "payment_record_voided_at",
        2,
        include_str!("migrations/002_payment_record_voided_at.sql"),
    ),
    (
        "payment_record_group_ids",
        3,
        include_str!("migrations/003_payment_record_group_ids.sql"),
    ),
];

pub fn migrations() -> Vec<Migration> {
    MIGRATION_FILES
        .iter()
        .map(|(description, version, sql)| Migration {
            version: *version,
            description,
            sql,
            kind: MigrationKind::Up,
        })
        .collect()
}
