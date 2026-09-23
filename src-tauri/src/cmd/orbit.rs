use super::{CmdResult, proxy_aware_error};
use crate::{
    cmd::StringifyErr as _,
    config::IOrbit,
    core::notification::{self, FailedOperation},
    feat,
};
use clash_orbit_draft::SharedDraft;

/// 获取Orbit配置
#[tauri::command]
pub async fn get_orbit_config() -> CmdResult<SharedDraft<IOrbit>> {
    feat::fetch_orbit_config().await.stringify_err()
}

/// 修改Orbit配置
#[tauri::command]
pub async fn patch_orbit_config(payload: IOrbit) -> CmdResult {
    let operation = system_proxy_operation(&payload);
    let result = match operation {
        Some(operation) => notification::asking_for(operation, Box::pin(feat::patch_orbit(&payload, false))).await,
        None => feat::patch_orbit(&payload, false).await,
    };
    result.map_err(|error| proxy_aware_error(&error).asking_for(operation))
}

/// Extract a system proxy operation from a Orbit patch.
const fn system_proxy_operation(payload: &IOrbit) -> Option<FailedOperation> {
    match payload.enable_system_proxy {
        Some(true) => Some(FailedOperation::SystemProxyEnable),
        Some(false) => Some(FailedOperation::SystemProxyDisable),
        None => None,
    }
}
