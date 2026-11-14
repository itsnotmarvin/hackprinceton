import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist } from '../../shared/api'
import { useAsync } from '../../shared/useAsync'
import { VerdictBadge } from '../../shared/components/VerdictBadge'
import { ErrorState, Loading } from '../../shared/components/States'
import type { WatchItem } from '../../shared/types'
import { usePageTitle } from './usePageTitle'
import './detail.css'

const hrefFor = (i: WatchItem) => `/${i.kind}/${i.id}`

export function WatchlistPage() {
  const [version, setVersion] = useState(0)
  const state = useAsync(getWatchlist, [version])
  usePageTitle('Watchlist')

  if (state.status === 'loading') return <Loading />
  if (state.status === 'error') return <ErrorState error={state.error} />
  const items = state.data.items

  const changes = items
    .flatMap((i) => i.changes.map((c) => ({ ...c, item: i })))
    .sort((a, b) => b.date.localeCompare(a.date))

  async function remove(id: string) {
    await removeFromWatchlist(id)
    setVersion((v) => v + 1)
  }

  return (
    <div className="detail">
      <h1>Watchlist</h1>

      {changes.length > 0 && (
        <section className="card">
          <h2>What changed</h2>
          <ul className="changes">
            {changes.map((c, i) => (
              <li key={i} className={`change change-${c.direction}`}>
                <span className="change-arrow" aria-label={c.direction}>
                  {c.direction === 'better' ? '▲' : '▼'}
                </span>
                <div>
                  <Link to={hrefFor(c.item)} state={{ name: c.item.name }}>
                    <strong>{c.item.name}</strong>
                  </Link>
                  <span> {c.text}</span>
                  <div className="muted small">{c.date}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Saved</h2>
        {items.length === 0 ? (
          <p className="muted">Nothing saved yet. Tap the heart on a region or parcel to watch it.</p>
        ) : (
          <ul className="saved">
            {items.map((i) => (
              <li key={i.id}>
                <Link to={hrefFor(i)} state={{ name: i.name }} className="saved-name">
                  {i.name}
                </Link>
                <span className="tag">{i.kind}</span>
                {i.current.verdict && <VerdictBadge verdict={i.current.verdict} />}
                {i.current.score != null && <span className="muted">score {i.current.score}</span>}
                <button className="btn small saved-remove" onClick={() => remove(i.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
