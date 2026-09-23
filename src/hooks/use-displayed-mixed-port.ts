import { useClashInfo, useRuntimeConfig } from '@/hooks/use-clash'
import { useOrbit } from '@/hooks/use-orbit'
import { useClashConfigData } from '@/providers/app-data-context'
import { resolveDisplayedMixedPort } from '@/utils/mixed-port'

export const useDisplayedMixedPort = () => {
  const { clashConfig } = useClashConfigData()
  const { data: runtimeConfig } = useRuntimeConfig()
  const { clashInfo } = useClashInfo()
  const { orbit } = useOrbit()

  return resolveDisplayedMixedPort({
    live: clashConfig?.mixedPort,
    runtime: runtimeConfig?.['mixed-port'],
    selected: orbit?.orbit_mixed_port,
    merge: clashInfo?.mixed_port,
  })
}
