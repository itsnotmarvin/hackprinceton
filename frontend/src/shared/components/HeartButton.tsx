import { useEffect, useState } from 'react'
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '../api'
import type { WatchItem } from '../types'

type Props = Pick<WatchItem, 'kind' | 'id' | 'name' | 'current'> & { compact?: boolean }

export function HeartButton({ kind, id, name, current, compact = false }: Props) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    getWatchlist()
      .then((w) => live && setSaved(w.items.some((i) => i.id === id)))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [id])

  async function toggle() {
    setBusy(true)
    const next = !saved
    setSaved(next) // optimistic
    try {
      if (next) await addToWatchlist({ kind, id, name, current, changes: [] })
      else await removeFromWatchlist(id)
    } catch {
      setSaved(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      className={`heart${saved ? ' on' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
    >
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.5 0 5.6 3.6 4.3 6.8C19.5 16.4 12 21 12 21z" />
      </svg>
      {!compact && (saved ? 'Saved' : 'Save')}
    </button>
  )
}
