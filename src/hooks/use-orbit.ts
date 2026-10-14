import { useCallback } from 'react'

import { getOrbitConfig, patchOrbitConfig } from '@/services/cmds'
import { mutate } from '@/services/mutate'
import { getPreloadConfig, setPreloadConfig } from '@/services/preload'
import { setCacheData, useQuery } from '@/services/query-client'

export const useOrbit = () => {
  const initialOrbitConfig = getPreloadConfig()

  const { data: orbit, refetch } = useQuery({
    queryKey: ['getOrbitConfig'],
    queryFn: async () => {
      const config = await getOrbitConfig()
      setPreloadConfig(config)
      return config
    },
    initialData: initialOrbitConfig ?? undefined,
    revalidateOnMount: initialOrbitConfig ? false : undefined,
    staleTime: 5000,
  })

  const mutateOrbit = (
    updaterOrData?:
      | IOrbitConfig
      | ((prev: IOrbitConfig | undefined) => IOrbitConfig | undefined)
      | undefined,
    _revalidate?: boolean,
  ) => {
    if (updaterOrData === undefined) {
      void refetch()
      return
    }
    void setCacheData<IOrbitConfig>(
      ['getOrbitConfig'],
      typeof updaterOrData === 'function'
        ? (current) => updaterOrData(current ?? orbit)
        : updaterOrData,
    )
  }

  // Callers own the error toast (GuardState onCatch / page onError), so the
  // funnel must not add a second one.
  const patchOrbit = useCallback(async (value: Partial<IOrbitConfig>) => {
    await mutate(() => patchOrbitConfig(value), {
      id: 'patch-orbit-config',
      revalidate: [['getOrbitConfig']],
      errorNotice: false,
    })
  }, [])

  return {
    orbit,
    mutateOrbit,
    patchOrbit,
  }
}
