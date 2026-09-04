use serde::Deserialize;
use serde_json::Value as JsonValue;
use tauri::State;
use tauri_plugin_sql::{DbInstances, DbPool};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlStatement {
    pub query: String,
    #[serde(default)]
    pub values: Vec<JsonValue>,
}

/// Run multiple SQL statements on a single pooled connection inside one transaction.
///
/// The JS SQL plugin issues each `execute` on a pooled connection independently, so
/// `BEGIN` / `COMMIT` across separate invokes cannot work. Use this command instead.
#[tauri::command]
pub async fn run_sql_transaction(
    db_instances: State<'_, DbInstances>,
    db: String,
    statements: Vec<SqlStatement>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let pool = instances
        .get(&db)
        .ok_or_else(|| format!("Database not loaded: {db}"))?;

    match pool {
        DbPool::Sqlite(pool) => {
            let mut tx = pool.begin().await.map_err(|error| error.to_string())?;

            for statement in &statements {
                let mut query = sqlx::query(&statement.query);
                for value in &statement.values {
                    if value.is_null() {
                        query = query.bind(None::<String>);
                    } else if let Some(text) = value.as_str() {
                        query = query.bind(text.to_owned());
                    } else if let Some(number) = value.as_number() {
                        if let Some(integer) = number.as_i64() {
                            query = query.bind(integer);
                        } else {
                            query = query.bind(number.as_f64().unwrap_or_default());
                        }
                    } else if let Some(flag) = value.as_bool() {
                        query = query.bind(flag);
                    } else {
                        query = query.bind(value.to_string());
                    }
                }

                query
                    .execute(&mut *tx)
                    .await
                    .map_err(|error| error.to_string())?;
            }

            tx.commit().await.map_err(|error| error.to_string())?;
            Ok(())
        }
        #[allow(unreachable_patterns)]
        _ => Err("Only SQLite transactions are supported.".into()),
    }
}
