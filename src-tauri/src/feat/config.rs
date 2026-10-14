use crate::config::{Config, IOrbit};
use anyhow::Result;
use clash_orbit_draft::SharedDraft;
use serde_yaml_ng::Mapping;
use tokio::sync::MutexGuard;

pub async fn patch_clash(patch: &Mapping) -> Result<()> {
    let config_write = Config::try_lock_config_write()?;
    super::executor::apply(
        &config_write,
        super::executor::Patch::Clash(patch),
        super::effects::clash_effects(patch),
    )
    .await
}

/// Apply a patch, then reconcile TUN when its setting changes.
///
/// TUN patches do not always produce a Run State transition, so reconciliation is explicit.
pub async fn patch_orbit(patch: &IOrbit, not_save_file: bool) -> Result<()> {
    apply_orbit_patch(patch, not_save_file).await?;
    if patch.enable_tun_mode.is_some() {
        super::reconcile_tun_availability().await;
    }
    Ok(())
}

/// Apply a patch without post-update reconciliation.
pub(super) async fn apply_orbit_patch(patch: &IOrbit, not_save_file: bool) -> Result<()> {
    let config_write = Config::try_lock_config_write()?;
    apply_orbit_patch_locked(&config_write, patch, not_save_file).await
}

/// Apply a patch with the shared configuration write lock already held.
/// Callers must pass the guard returned by [`Config::lock_config_write`].
pub(super) async fn apply_orbit_patch_locked(
    _config_write: &MutexGuard<'_, ()>,
    patch: &IOrbit,
    not_save_file: bool,
) -> Result<()> {
    super::executor::apply(
        _config_write,
        super::executor::Patch::Orbit {
            patch,
            persist: !not_save_file,
        },
        super::effects::orbit_effects(patch),
    )
    .await
}

pub async fn fetch_orbit_config() -> Result<SharedDraft<IOrbit>> {
    let draft = Config::orbit().await;
    let data = draft.data_arc();
    Ok(data)
}
