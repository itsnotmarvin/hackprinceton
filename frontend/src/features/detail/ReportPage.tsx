import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getReport, investigate } from '../../shared/api'
import { usePageTitle } from './usePageTitle'
import { ErrorState } from '../../shared/components/States'
import type { Report } from '../../shared/types'
import './detail.css'

const POLL_MS = 2000

export function ReportPage() {
  const { id = '' } = useParams()
  const { search } = useLocation()
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)
  const navigate = useNavigate()
  usePageTitle(report?.status === 'done' ? `Report · ${report.site.name}` : 'Investigating…')

  // Poll until the agent is done or failed. Never block the page on it.
  useEffect(() => {
    let live = true
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      try {
        const r = await getReport(id)
        if (!live) return
        setReport(r)
        if (r.status === 'running') timer = setTimeout(tick, POLL_MS)
      } catch (e) {
        if (live) setError(e as Error)
      }
    }
    tick()
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [id, attempt])

  if (error) return <ErrorState error={error} />

  if (!report || report.status === 'running') {
    return (
      <div className="detail">
        <div className="card report-running">
          <span className="spinner" />
          <div>
            <h2>Investigating{report ? ` ${report.site.name}` : ''}…</h2>
            <p className="muted">Researching power, water, land, community.</p>
          </div>
        </div>
      </div>
    )
  }

  if (report.status === 'failed') {
    const site = report.site
    const retry = async () => {
      const { report_id } = await investigate(site.kind, site.id)
      setReport(null)
      navigate(`/report/${report_id}${search}`, { replace: true })
      setAttempt((a) => a + 1)
    }
    return (
      <div className="detail">
        <div className="card">
          <h2>The investigation didn't finish</h2>
          <p className="muted">The site's numbers are still valid. You can run the research again.</p>
          <div className="actions">
            <button className="btn btn-primary" onClick={retry}>
              Try again
            </button>
            <Link className="btn" to={`/${site.kind}/${site.id}${search}`}>
              Back to {site.name}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const back = `/${report.site.kind}/${report.site.id}${search}`

  return (
    <div className="detail">
      <Link to={back} className="back">
        ← Back to {report.site.name}
      </Link>
      <header>
        <p className="muted small">Investigation report</p>
        <h1>{report.site.name}</h1>
      </header>

      <section className="card summary">
        <p>{report.summary}</p>
        <p className="muted small">Generated {new Date(report.generated_at).toLocaleString()}</p>
      </section>

      {report.changes_since_last.length > 0 && (
        <section className="card">
          <h2>Changes since last report</h2>
          <ul>
            {report.changes_since_last.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="sections">
        {report.sections.map((s) => (
          <section key={s.topic} className="card">
            <div className="section-head">
              <h2 className="topic">{s.topic}</h2>
              <span className={`risk risk-${s.risk}`}>{s.risk} risk</span>
            </div>
            <p>{s.finding}</p>
            {s.sources.length > 0 && (
              <ul className="sources small">
                {s.sources.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} target="_blank" rel="noreferrer">
                      {src.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
