import { beforeEach, describe, expect, it, vi } from 'vitest'

import { subscribeOrbitEvents } from './events'

const listen = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/api/event', () => ({ listen }))

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  listen.mockReset()
})

describe('subscribeOrbitEvents', () => {
  it('reports readiness only after every listener is registered', async () => {
    const registrations: Array<() => void> = []
    listen.mockImplementation(
      () =>
        new Promise((resolve) => {
          registrations.push(() => resolve(() => {}))
        }),
    )
    const onSubscribed = vi.fn()

    subscribeOrbitEvents(
      {
        'orbit://run-state-changed': () => {},
        'orbit://notice-message': () => {},
      },
      onSubscribed,
    )

    registrations[0]?.()
    await flush()
    expect(onSubscribed).not.toHaveBeenCalled()

    registrations[1]?.()
    await flush()
    expect(onSubscribed).toHaveBeenCalledOnce()
  })

  it('delivers a payload to its matching handler', () => {
    const handlers = new Map<string, (payload: unknown) => void>()
    listen.mockImplementation(
      (name: string, handler: (event: unknown) => void) => {
        handlers.set(name, (payload) => handler({ payload }))
        return Promise.resolve(() => {})
      },
    )
    const onRunState = vi.fn()

    subscribeOrbitEvents({ 'orbit://run-state-changed': onRunState })
    handlers.get('orbit://run-state-changed')?.({ mode: 'Sidecar' })

    expect(onRunState).toHaveBeenCalledWith({ mode: 'Sidecar' })
  })
})
