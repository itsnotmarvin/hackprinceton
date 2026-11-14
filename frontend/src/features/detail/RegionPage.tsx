import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getRegion, investigate } from '../../shared/api'
import { usePageTitle } from './usePageTitle'
import { fromQuery, toQuery } from '../../shared/search'
import { useAsync } from '../../shared/useAsync'
import { liters, num, usd } from '../../shared/format'
import { HeartButton } from '../../shared/components/HeartButton'
import { VerdictBadge } from '../../shared/components/VerdictBadge'
import { ErrorState, Loading } from '../../shared/components/States'
import './detail.css'

export function RegionPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const req = fromQuery(search)
  const navigate = useNavigate()
  const state = useAsync(() => getRegion(id, req), [id, search])
  const [starting, setStarting] = useState(false)
  usePageTitle(state.status === 'ok' ? state.data.name : undefined)

  if (state.status === 'loading') return <Loading text="Running the numbers…" />
  if (state.status === 'error') return <ErrorState error={state.error} />
  const r = state.data
  const b = r.breakdown
  const q = toQuery(req)
  const isOrbit = r.id === 'orbit'

  async function onInvestigate() {
    setStarting(true)
    try {
      const { report_id } = await investigate('region', r.id)
      navigate(`/report/${report_id}?${q}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="detail">
      <Link to={`/?${q}`} className="back">
        ← Back to results
      </Link>

      <header className="detail-header">
        <div>
          <h1>{r.name}</h1>
          <p className="muted">
            {num(req.capacity_mw)} MW · ready by {req.ready_by_year}
          </p>
        </div>
        {r.score != null && (
          <div className={`score${isOrbit ? ' score-orbit' : ''}`}>
            <span className="score-num">{r.score}</span>
            <span className="small">score</span>
          </div>
        )}
        <div className="actions">
          <HeartButton kind="region" id={r.id} name={r.name} current={{ score: r.score }} />
          <button className="btn btn-primary" onClick={onInvestigate} disabled={starting}>
            {starting ? 'Starting…' : 'Investigate'}
          </button>
        </div>
      </header>

      <section className="card">
        <h2>What it takes</h2>
        <div className="stats">
          <Stat label="Build cost" value={usd(b.build_cost_usd)} />
          <Stat label="Operating cost per year" value={usd(b.annual_operating_cost_usd)} />
          <Stat label="Total power draw" value={`${num(b.facility_power_mw)} MW`} />
          <Stat label="Heat to remove" value={`${num(b.cooling_load_mw)} MW`} />
          <Stat
            label="Water per year"
            value={liters(b.annual_water_liters)}
            sub={
              b.water_household_equivalent > 0
                ? `About ${num(b.water_household_equivalent)} households' use`
                : 'No water needed'
            }
          />
          <Stat label="Energy per year" value={`${num(b.annual_energy_mwh)} MWh`} />
          {isOrbit && b.solar_array_m2 != null && (
            <Stat label="Solar array" value={`${num(b.solar_array_m2)} m²`} />
          )}
          {isOrbit && b.radiator_m2 != null && <Stat label="Radiators" value={`${num(b.radiator_m2)} m²`} />}
          {isOrbit && b.launch_mass_kg != null && (
            <Stat label="Launch mass" value={`${num(b.launch_mass_kg / 1000)} t`} />
          )}
          {isOrbit && b.launch_cost_usd != null && <Stat label="Launch cost" value={usd(b.launch_cost_usd)} />}
        </div>
      </section>

      {r.risk_notes.length > 0 && (
        <section className="card">
          <h2>Risks to know about</h2>
          <ul className="risk-notes">
            {r.risk_notes.map((n, i) => (
              <li key={i}>
                <span className="tag">{n.factor}</span> {n.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Land for sale</h2>
        {r.parcels.length > 0 ? (
          <ul className="parcel-list">
            {r.parcels.map((p) => (
              <li key={p.id}>
                <Link to={`/parcel/${p.id}?${q}`} state={{ name: p.name }}>
                  <span>{p.name}</span>
                  <VerdictBadge verdict={p.verdict} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Site-level analysis available in Houston and Los Angeles.</p>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
      {sub && <span className="muted small">{sub}</span>}
    </div>
  )
}
