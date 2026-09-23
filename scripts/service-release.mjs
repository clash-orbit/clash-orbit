// clash-orbit/clash-orbit-service-ipc publishes its own releases: the v2.7.3
// release carries the seven clash-orbit-service-ipc-v2.7.3-*.zip / *.tar.gz
// assets (three Windows plus four Linux targets, no macOS).
const SERVICE_URL_PREFIX =
  'https://github.com/clash-orbit/clash-orbit-service-ipc/releases/download'

export function resolveServiceRelease(cargoManifest, host, platform) {
  const dependency = cargoManifest
    .split(/\r?\n/)
    .find((line) => line.trimStart().startsWith('clash_orbit_service_ipc ='))
  const packageVersion = dependency?.match(/\bversion\s*=\s*"([^"]+)"/)?.[1]
  if (!packageVersion) {
    throw new Error(
      'clash_orbit_service_ipc dependency must declare an inline version',
    )
  }

  const version = `v${packageVersion}`
  const archiveExt = platform === 'win32' ? 'zip' : 'tar.gz'
  const archiveFile = `clash-orbit-service-ipc-${version}-${host}.${archiveExt}`
  return {
    version,
    archiveFile,
    downloadURL: `${SERVICE_URL_PREFIX}/${version}/${archiveFile}`,
  }
}
