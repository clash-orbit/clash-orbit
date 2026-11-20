use super::CmdResult;
use crate::{
    cmd::StringifyErr as _,
    config::{Config, IOrbit},
    core, feat,
};
use smartstring::alias::String;

#[tauri::command]
#[specta::specta]
pub async fn save_webdav_config(
    url: std::string::String,
    username: std::string::String,
    password: std::string::String,
) -> CmdResult<()> {
    let url: String = url.into();
    let username: String = username.into();
    let password: String = password.into();
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
#[specta::specta]
pub async fn create_webdav_backup() -> CmdResult<()> {
    feat::create_backup_and_upload_webdav().await.stringify_err()
}

#[tauri::command]
#[specta::specta]
pub async fn list_webdav_backup() -> CmdResult<Vec<crate::ipc::WebDavFile>> {
    feat::list_wevdav_backup()
        .await
        .map(|files| files.into_iter().map(Into::into).collect())
        .stringify_err()
}

#[tauri::command]
#[specta::specta]
pub async fn delete_webdav_backup(filename: std::string::String) -> CmdResult<()> {
    let filename: String = filename.into();
    feat::delete_webdav_backup(filename).await.stringify_err()
}

#[tauri::command]
#[specta::specta]
pub async fn restore_webdav_backup(filename: std::string::String) -> CmdResult<()> {
    let filename: String = filename.into();
    feat::restore_webdav_backup(filename)
        .await
        .map_err(|error| super::proxy_aware_error(&error))
}
