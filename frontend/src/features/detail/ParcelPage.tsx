import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getParcel, investigate } from '../../shared/api'
import { fromQuery, toQuery } from '../../shared/search'
import { useAsync } from '../../shared/useAsync'
import { usdExact, num } from '../../shared/format'
import { HeartButton } from '../../shared/components/HeartButton'
import { VerdictBadge } from '../../shared/components/VerdictBadge'
import { ErrorState, Loading } from '../../shared/components/States'
import type { CheckStatus } from '../../shared/types'
import './detail.css'

const CHECK_LABEL: Record<string, string> = {
  size: 'Size',
  neighbors: 'Neighbors',
  flood: 'Flood risk',
  power: 'Power access',
  price: 'Price',
}

export function ParcelPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const req = fromQuery(search)
  const state = useAsync(() => getParcel(id, req), [id, search])
  const [starting, setStarting] = useState(false)

  if (state.status === 'loading') return <Loading text="Checking this parcel…" />
  if (state.status === 'error') return <ErrorState error={state.error} />
  const p = state.data
  const q = toQuery(req)

  async function onInvestigate() {
    setStarting(true)
    try {
      const { report_id } = await investigate('parcel', p.id)
      navigate(`/report/${report_id}?${q}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="detail">
      <Link to={`/region/${p.region_id}?${q}`} className="back">
        ← Back to region
      </Link>

      <div className="parcel-grid">
        <AerialImage src={p.image_url} lat={p.lat} lng={p.lng} />

        <div className="parcel-side">
          <div>
            <p className="muted small">{p.address}</p>
            <div className="facts">
              <Fact label="Size" value={`${num(p.acres)} acres`} />
              <Fact label="Asking price" value={`${usdExact(p.asking_price_per_acre)}/acre`} />
              <Fact label="Asking total" value={usdExact(p.asking_price_per_acre * p.acres)} />
            </div>
          </div>

          <div className="verdict-block">
            <VerdictBadge verdict={p.verdict} large />
            <p className="reason">{p.reason}</p>
            {p.verdict !== 'pass' && p.max_price_per_acre > 0 && (
              <p className="muted small">
                Walk-away price: <strong>{usdExact(p.max_price_per_acre)}/acre</strong> for{' '}
                {num(req.capacity_mw)} MW
              </p>
            )}
          </div>

          <div className="actions">
            <HeartButton
              kind="parcel"
              id={p.id}
              name={p.address}
              current={{ verdict: p.verdict }}
            />
            <button className="btn btn-primary" onClick={onInvestigate} disabled={starting}>
              {starting ? 'Starting…' : 'Investigate this site'}
            </button>
          </div>
        </div>
      </div>

      <section className="card">
        <h2>Site checks</h2>
        <ul className="checks">
          {p.checks.map((c) => (
            <li key={c.name}>
              <StatusIcon status={c.status} />
              <div>
                <strong>{CHECK_LABEL[c.name] ?? c.name}</strong>
                <span className="muted"> {c.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {p.matterport_model_id && (
        <section className="card">
          <h2>Inside the building</h2>
          <iframe
            className="matterport"
            title="Matterport 3D tour"
            src={`https://my.matterport.com/show/?m=${encodeURIComponent(p.matterport_model_id)}&play=1`}
            allow="xr-spatial-tracking; fullscreen"
          />
        </section>
      )}

      <p className="muted small">Sources: {p.sources.join(' · ')}</p>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span className="muted small">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AerialImage({ src, lat, lng }: { src: string; lat: number; lng: number }) {
  const [broken, setBroken] = useState(false)
  if (src && !broken) {
    return <img className="aerial" src={src} alt="Aerial view of the parcel" onError={() => setBroken(true)} />
  }
  return (
    <div className="aerial aerial-placeholder">
      <span>Aerial image (Vexcel)</span>
      <span className="small">
        {lat.toFixed(3)}, {lng.toFixed(3)}
      </span>
    </div>
  )
}

export function StatusIcon({ status }: { status: CheckStatus }) {
  const glyph = { pass: '✓', warn: '!', fail: '✕' }[status]
  const label = { pass: 'Pass', warn: 'Warning', fail: 'Fail' }[status]
  return (
    <span className={`status status-${status}`} role="img" aria-label={label}>
      {glyph}
    </span>
  )
}
