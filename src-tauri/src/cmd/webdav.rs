use super::CmdResult;
use crate::{
    cmd::StringifyErr as _,
    config::{Config, IOrbit},
    core, feat,
};
use reqwest_dav::list_cmd::ListFile;
use smartstring::alias::String;

#[tauri::command]
pub async fn save_webdav_config(url: String, username: String, password: String) -> CmdResult<()> {
    let patch = IOrbit {
        webdav_url: Some(url),
        webdav_username: Some(username),
        webdav_password: Some(password),
        ..IOrbit::default()
    };
    Config::orbit().await.edit_draft(|e| e.patch_config(&patch));
    Config::orbit().await.apply();

    let orbit_data = Config::orbit().await.data_arc();
    orbit_data.save_file().await.stringify_err()?;
    core::backup::WebDavClient::global().reset();
    Ok(())
}

#[tauri::command]
pub async fn create_webdav_backup() -> CmdResult<()> {
    feat::create_backup_and_upload_webdav().await.stringify_err()
}

#[tauri::command]
pub async fn list_webdav_backup() -> CmdResult<Vec<ListFile>> {
    feat::list_wevdav_backup().await.stringify_err()
}

#[tauri::command]
pub async fn delete_webdav_backup(filename: String) -> CmdResult<()> {
    feat::delete_webdav_backup(filename).await.stringify_err()
}

#[tauri::command]
pub async fn restore_webdav_backup(filename: String) -> CmdResult<()> {
    feat::restore_webdav_backup(filename)
        .await
        .map_err(|error| super::proxy_aware_error(&error))
}
