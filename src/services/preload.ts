import { getOrbitConfig } from './cmds'
import {
  cacheLanguage,
  getCachedLanguage,
  initializeLanguage,
  resolveLanguage,
} from './i18n'

let orbitConfigCache: IOrbitConfig | null | undefined

const detectSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const getThemeModeFromWindow = (): IOrbitConfig['theme_mode'] | undefined => {
  if (typeof window === 'undefined') return undefined
  const mode = (
    window as typeof window & {
      __ORBIT_INITIAL_THEME_MODE?: unknown
    }
  ).__ORBIT_INITIAL_THEME_MODE
  if (mode === 'light' || mode === 'dark' || mode === 'system') {
    return mode
  }
  return undefined
}

export const resolveThemeMode = (
  orbitConfig?: IOrbitConfig | null,
): 'light' | 'dark' => {
  const initialMode = orbitConfig?.theme_mode ?? getThemeModeFromWindow()
  if (initialMode === 'dark' || initialMode === 'light') {
    return initialMode
  }
  return detectSystemTheme()
}

export const setPreloadConfig = (config: IOrbitConfig | null) => {
  orbitConfigCache = config
}

export const getPreloadConfig = () => orbitConfigCache

const preloadConfig = async () => {
  try {
    const config = await getOrbitConfig()
    setPreloadConfig(config)
    return config
  } catch (error) {
    console.warn('[preload.ts] Failed to read Orbit config:', error)
    setPreloadConfig(null)
    return null
  }
}

const preloadLanguage = async (
  orbitConfig?: IOrbitConfig | null,
  loadConfig: () => Promise<IOrbitConfig | null> = preloadConfig,
) => {
  const cachedLanguage = getCachedLanguage()
  if (cachedLanguage) {
    return cachedLanguage
  }

  let resolvedConfig = orbitConfig

  if (resolvedConfig === undefined) {
    try {
      resolvedConfig = await loadConfig()
    } catch (error) {
      console.warn(
        '[preload.ts] Failed to read language from Orbit config:',
        error,
      )
      resolvedConfig = null
    }
  }

  const languageFromConfig = resolvedConfig?.language
  if (languageFromConfig) {
    const resolved = resolveLanguage(languageFromConfig)
    cacheLanguage(resolved)
    return resolved
  }

  const browserLanguage = resolveLanguage(
    typeof navigator !== 'undefined' ? navigator.language : undefined,
  )
  cacheLanguage(browserLanguage)
  return browserLanguage
}

export const preloadAppData = async () => {
  const configPromise = preloadConfig()
  const initialLanguage = await preloadLanguage(undefined, () => configPromise)
  const [config] = await Promise.all([
    configPromise,
    initializeLanguage(initialLanguage),
  ])
  const initialThemeMode = resolveThemeMode(config)
  return { initialThemeMode }
}
