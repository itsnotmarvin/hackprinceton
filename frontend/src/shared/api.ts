// One client for every contract endpoint. SHARED FILE: tell the team before changing.
//
// VITE_API_BASE unset  -> mock mode: reads /mocks/*.json (repo root), watchlist lives in localStorage.
// VITE_API_BASE set    -> live mode: calls the Data + API backend.
import type { Parcel, RankRequest, RankResponse, Region, Report, WatchItem, Watchlist } from './types'
import { toQuery } from './search'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || ''
export const MOCK_MODE = !BASE

const mockFiles = import.meta.glob('../../../mocks/*.json', { eager: true, import: 'default' }) as Record<
  string,
  unknown
>

/** Looks for mocks/<name>-<id>.json, then mocks/<name>.json. */
function mock<T>(name: string, id?: string): T {
  const find = (file: string) => mockFiles[`../../../mocks/${file}.json`]
  const hit = (id && find(`${name}-${id}`)) || find(name)
  if (!hit) throw new Error(`No mock file for ${name}${id ? ` (${id})` : ''}`)
  return structuredClone(hit) as T
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ---- 1. rank ----
export async function rank(req: RankRequest): Promise<RankResponse> {
  if (MOCK_MODE) return delay().then(() => mock<RankResponse>('rank'))
  return http('/api/rank', { method: 'POST', body: JSON.stringify(req) })
}

// ---- 2. region ----
export async function getRegion(id: string, req: RankRequest): Promise<Region> {
  if (MOCK_MODE) {
    await delay()
    const r = mock<Region>('region', id)
    if (r.id !== id) throw new Error(`No mock for region "${id}"`)
    return r
  }
  return http(`/api/region/${encodeURIComponent(id)}?${toQuery(req)}`)
}

// ---- 3. parcel ----
export async function getParcel(id: string, req: RankRequest): Promise<Parcel> {
  if (MOCK_MODE) {
    await delay()
    const p = mock<Parcel>('parcel', id)
    if (p.id !== id) throw new Error(`No mock for parcel "${id}"`)
    return p
  }
  return http(`/api/parcel/${encodeURIComponent(id)}?${toQuery(req)}`)
}

// ---- 4. watchlist ----
const WL_KEY = 'hp.watchlist.v1'

function readLocalWatchlist(): Watchlist {
  try {
    const raw = localStorage.getItem(WL_KEY)
    if (raw) return JSON.parse(raw) as Watchlist
  } catch {
    /* storage blocked: fall through to seed */
  }
  return mock<Watchlist>('watchlist')
}

function writeLocalWatchlist(w: Watchlist) {
  try {
    localStorage.setItem(WL_KEY, JSON.stringify(w))
  } catch {
    /* ignore */
  }
}

export async function getWatchlist(): Promise<Watchlist> {
  if (MOCK_MODE) return delay(100).then(readLocalWatchlist)
  return http('/api/watchlist')
}

export async function addToWatchlist(item: Pick<WatchItem, 'kind' | 'id'> & Partial<WatchItem>): Promise<void> {
  if (MOCK_MODE) {
    const w = readLocalWatchlist()
    if (!w.items.some((i) => i.id === item.id)) {
      w.items.push({ name: item.id, current: {}, changes: [], ...item })
      writeLocalWatchlist(w)
    }
    return
  }
  await http('/api/watchlist', { method: 'POST', body: JSON.stringify({ kind: item.kind, id: item.id }) })
}

export async function removeFromWatchlist(id: string): Promise<void> {
  if (MOCK_MODE) {
    const w = readLocalWatchlist()
    w.items = w.items.filter((i) => i.id !== id)
    writeLocalWatchlist(w)
    return
  }
  await http(`/api/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ---- 5. investigation report ----
const mockStarted = new Map<string, number>()

export async function investigate(kind: 'region' | 'parcel', id: string): Promise<{ report_id: string; status: string }> {
  if (MOCK_MODE) {
    const report_id = `mock-${id}`
    mockStarted.set(report_id, Date.now())
    return { report_id, status: 'running' }
  }
  return http('/api/investigate', { method: 'POST', body: JSON.stringify({ kind, id }) })
}

export async function getReport(reportId: string): Promise<Report> {
  if (MOCK_MODE) {
    await delay(150)
    // mock ids are "mock-<siteId>"; pre-written reports live in mocks/report-<siteId>.json
    const r = mock<Report>('report', reportId.replace(/^mock-/, ''))
    r.report_id = reportId
    const started = mockStarted.get(reportId)
    // pretend the agent takes ~3 s the first time it's run this session
    if (started && Date.now() - started < 3000) r.status = 'running'
    return r
  }
  return http(`/api/report/${encodeURIComponent(reportId)}`)
}
