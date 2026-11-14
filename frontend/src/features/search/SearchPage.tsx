// PLACEHOLDER: owned by Frontend 1. Replace this whole file freely.
// It only exists so Frontend 2's pages are reachable during the skeleton phase.
// Contract for navigation: link to `/region/:id?${toQuery(currentSearch)}`.
import { Link } from 'react-router-dom'
import { rank } from '../../shared/api'
import { DEMO_SEARCH, toQuery } from '../../shared/search'
import { useAsync } from '../../shared/useAsync'
import { ErrorState, Loading } from '../../shared/components/States'
import { usd } from '../../shared/format'

export function SearchPage() {
  const state = useAsync(() => rank(DEMO_SEARCH), [])
  const q = toQuery(DEMO_SEARCH)

  if (state.status === 'loading') return <Loading />
  if (state.status === 'error') return <ErrorState error={state.error} />

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p className="muted small">Placeholder search page (Frontend 1 builds the real one).</p>
      <p>{state.data.break_even.text}</p>
      {state.data.options.map((o) => (
        <Link key={o.id} to={`/region/${o.id}?${q}`} className="card" style={{ color: 'inherit' }}>
          <strong>
            #{o.rank} {o.name}
          </strong>{' '}
          · score {o.score} · {usd(o.cost_per_mw_year)}/MW-yr · {o.reason}
        </Link>
      ))}
    </div>
  )
}
