// How the current search travels between screens: as URL query params.
// Frontend 1 links to `/region/houston?${toQuery(req)}`; Frontend 2 reads it back with fromQuery().
// SHARED FILE: tell the team before changing.
import type { Cooling, Priority, RankRequest } from './types'

export const DEMO_SEARCH: RankRequest = {
  capacity_mw: 100,
  ready_by_year: 2029,
  priority: 'cost',
  assumptions: { launch_cost_per_kg: 1500, power_price_multiplier: 1.0, cooling: 'water' },
}

/** Flat query string: capacity_mw, ready_by_year, priority, launch_cost_per_kg, power_price_multiplier, cooling */
export function toQuery(req: RankRequest): string {
  const p = new URLSearchParams()
  p.set('capacity_mw', String(req.capacity_mw))
  p.set('ready_by_year', String(req.ready_by_year))
  p.set('priority', req.priority)
  const a = req.assumptions ?? {}
  if (a.launch_cost_per_kg != null) p.set('launch_cost_per_kg', String(a.launch_cost_per_kg))
  if (a.power_price_multiplier != null) p.set('power_price_multiplier', String(a.power_price_multiplier))
  if (a.cooling) p.set('cooling', a.cooling)
  return p.toString()
}

export function fromQuery(search: string): RankRequest {
  const p = new URLSearchParams(search)
  const num = (k: string, d: number) => {
    const v = Number(p.get(k))
    return p.has(k) && Number.isFinite(v) ? v : d
  }
  const d = DEMO_SEARCH
  const da = d.assumptions!
  return {
    capacity_mw: num('capacity_mw', d.capacity_mw),
    ready_by_year: num('ready_by_year', d.ready_by_year),
    priority: (p.get('priority') as Priority) ?? d.priority,
    assumptions: {
      launch_cost_per_kg: num('launch_cost_per_kg', da.launch_cost_per_kg!),
      power_price_multiplier: num('power_price_multiplier', da.power_price_multiplier!),
      cooling: (p.get('cooling') as Cooling) ?? da.cooling,
    },
  }
}
