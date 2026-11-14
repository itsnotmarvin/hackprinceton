import { describe, expect, it } from 'vitest'
import { priceBarLayout, usdShort } from './price'
import { DEMO_SEARCH, fromQuery, toQuery } from '../../shared/search'
import { getParcel, getRegion, getReport } from '../../shared/api'
import type { Parcel, Region, Report } from '../../shared/types'

const mockFiles = import.meta.glob('../../../../mocks/*.json', { eager: true, import: 'default' }) as Record<
  string,
  unknown
>
const byPrefix = <T,>(prefix: string) =>
  Object.entries(mockFiles)
    .filter(([path]) => new RegExp(`/${prefix}(-[^/]+)?\\.json$`).test(path))
    .map(([path, data]) => [path, data as T] as const)

describe('priceBarLayout', () => {
  it('returns null when there is no walk-away price (Pass)', () => {
    expect(priceBarLayout(3_100_000, 0)).toBeNull()
  })

  it('puts asking left of max when within budget', () => {
    const l = priceBarLayout(145_000, 210_000)!
    expect(l.withinBudget).toBe(true)
    expect(l.askPct).toBeLessThan(l.maxPct)
    expect(l.gapPerAcre).toBe(-65_000)
  })

  it('flags over-budget and keeps both markers on the bar', () => {
    const l = priceBarLayout(240_000, 190_000)!
    expect(l.withinBudget).toBe(false)
    expect(l.askPct).toBeGreaterThan(l.maxPct)
    expect(l.askPct).toBeLessThanOrEqual(100)
  })
})

describe('usdShort', () => {
  it('formats thousands and millions', () => {
    expect(usdShort(145_000)).toBe('$145k')
    expect(usdShort(3_100_000)).toBe('$3.1M')
    expect(usdShort(2_000_000)).toBe('$2M')
  })
})

describe('search query round-trip', () => {
  it('survives toQuery -> fromQuery', () => {
    const req = { ...DEMO_SEARCH, capacity_mw: 250, priority: 'speed' as const }
    expect(fromQuery(toQuery(req))).toEqual(req)
  })

  it('falls back to the demo search for missing params', () => {
    expect(fromQuery('')).toEqual(DEMO_SEARCH)
  })
})

describe('mock API', () => {
  it('serves the demo parcels with the expected verdicts', async () => {
    expect((await getParcel('hou-001', DEMO_SEARCH)).verdict).toBe('buy')
    expect((await getParcel('la-001', DEMO_SEARCH)).verdict).toBe('pass')
  })

  it('rejects unknown ids instead of silently showing another site', async () => {
    await expect(getParcel('nope', DEMO_SEARCH)).rejects.toThrow()
    await expect(getRegion('nope', DEMO_SEARCH)).rejects.toThrow()
  })

  it('serves a report for each site', async () => {
    for (const id of ['hou-001', 'hou-002', 'la-001', 'houston', 'los-angeles', 'orbit']) {
      const r = await getReport(`mock-${id}`)
      expect(r.site.id).toBe(id)
    }
  })
})

// Guards the contract (01-contract.md) for every mock file, so Data + API can diff against them.
describe('mock files match the contract', () => {
  it('parcels', () => {
    const parcels = byPrefix<Parcel>('parcel')
    expect(parcels.length).toBeGreaterThan(0)
    for (const [path, p] of parcels) {
      expect(['buy', 'maybe', 'pass'], path).toContain(p.verdict)
      for (const c of p.checks) expect(['pass', 'warn', 'fail'], path).toContain(c.status)
      expect(p.reason.length, path).toBeGreaterThan(0)
      // A failed check must mean Pass (04-model-agent.md, A8)
      if (p.checks.some((c) => c.status === 'fail')) expect(p.verdict, path).toBe('pass')
    }
  })

  it('regions', () => {
    for (const [path, r] of byPrefix<Region>('region')) {
      expect(typeof r.breakdown.build_cost_usd, path).toBe('number')
      for (const p of r.parcels) expect(['buy', 'maybe', 'pass'], path).toContain(p.verdict)
      if (r.id === 'orbit') expect(r.breakdown.annual_water_liters, path).toBe(0)
    }
  })

  it('reports: every finding has a source', () => {
    for (const [path, r] of byPrefix<Report>('report')) {
      expect(['running', 'done', 'failed'], path).toContain(r.status)
      for (const s of r.sections) {
        expect(['power', 'water', 'land', 'community'], path).toContain(s.topic)
        expect(s.sources.length, `${path} ${s.topic}`).toBeGreaterThan(0)
      }
    }
  })
})
