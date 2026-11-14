import { useEffect, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'error'; error: Error } | { status: 'ok'; data: T }

/** Runs `fn` whenever `deps` change; ignores stale results. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  useEffect(() => {
    let live = true
    setState({ status: 'loading' })
    fn().then(
      (data) => live && setState({ status: 'ok', data }),
      (error: Error) => live && setState({ status: 'error', error }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
