// GitHub does not copy Releases when a repository is forked, so clash-orbit's
// fork of clash-verge-service-ipc has the v2.7.3 tag but no release assets yet.
// This stays on upstream until that release exists, otherwise `pnpm prebuild`
// fails with a 404. Once the fork has a v2.7.3 release carrying the nine
// clash-verge-service-ipc-v2.7.3-*.zip / *.tar.gz assets, switch this to:
//   'https://github.com/clash-orbit/clash-orbit-service-ipc/releases/download'
const SERVICE_URL_PREFIX =
  'https://github.com/clash-verge-rev/clash-verge-service-ipc/releases/download'

export function resolveServiceRelease(cargoManifest, host, platform) {
  const dependency = cargoManifest
    .split(/\r?\n/)
    .find((line) => line.trimStart().startsWith('clash_verge_service_ipc ='))
  const packageVersion = dependency?.match(/\bversion\s*=\s*"([^"]+)"/)?.[1]
  if (!packageVersion) {
    throw new Error(
      'clash_verge_service_ipc dependency must declare an inline version',
    )
  }

  const version = `v${packageVersion}`
  const archiveExt = platform === 'win32' ? 'zip' : 'tar.gz'
  const archiveFile = `clash-verge-service-ipc-${version}-${host}.${archiveExt}`
  return {
    version,
    archiveFile,
    downloadURL: `${SERVICE_URL_PREFIX}/${version}/${archiveFile}`,
  }
}
