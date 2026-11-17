// Schema migrations run from the frontend (src/lib/db.ts, `PRAGMA user_version`), so the
// SQL plugin is registered without Rust-side migrations.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running Stufe");
}
