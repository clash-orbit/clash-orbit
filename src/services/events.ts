import { listen, type UnlistenFn } from '@tauri-apps/api/event'

import type { RunState } from './cmds'

/** Centralizes frontend event names and payload types for the unchecked Rust IPC seam. */
interface OrbitEvents {
  'orbit://refresh-clash-config': string
  'orbit://refresh-verge-config': string
  'orbit://refresh-profiles': string
  'orbit://refresh-proxy-config': null
  /** A backend message for the user: `[status, message]`. */
  'orbit://notice-message': [string, string]
  'orbit://timer-updated': string
  'orbit://run-state-changed': RunState
  'orbit://pending-failures-changed': null
  'profile-changed': string
  'profile-update-started': { uid?: string }
  'profile-update-completed': { uid?: string }
  'orbit://test-all': null
}

type OrbitEventName = keyof OrbitEvents

type OrbitEventHandlers = {
  [Name in OrbitEventName]?: (payload: OrbitEvents[Name]) => void
}

/**
 * Returns synchronous teardown for asynchronous registrations. `onSubscribed` lets callers
 * reread event-only state after all listeners are live, closing the initial race window.
 */
export const subscribeOrbitEvents = (
  handlers: OrbitEventHandlers,
  onSubscribed?: () => void,
): (() => void) => {
  let disposed = false
  const unlisteners: UnlistenFn[] = []

  const registrations = Object.entries(handlers).map(([name, handler]) => {
    if (!handler) return Promise.resolve()

    return listen(name, ({ payload }) => {
      ;(handler as (payload: unknown) => void)(payload)
    })
      .then((unlisten) => {
        // Resolved after teardown: unsubscribe immediately rather than leak.
        if (disposed) {
          unlisten()
          return
        }
        unlisteners.push(unlisten)
      })
      .catch((error) => {
        console.error(`[events] failed to subscribe to ${name}:`, error)
      })
  })

  if (onSubscribed) {
    void Promise.all(registrations).then(() => {
      if (disposed) return
      onSubscribed()
    })
  }

  return () => {
    disposed = true
    for (const unlisten of unlisteners.splice(0)) {
      try {
        unlisten()
      } catch (error) {
        console.error('[events] teardown failed:', error)
      }
    }
  }
}
