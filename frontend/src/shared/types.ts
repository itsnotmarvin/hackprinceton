// Mirrors 01-contract.md. SHARED FILE: tell the team before changing a shape.

export type Priority = 'cost' | 'speed' | 'community'
export type Cooling = 'water' | 'dry'
export type Verdict = 'buy' | 'maybe' | 'pass'
export type CheckStatus = 'pass' | 'warn' | 'fail'
export type Labor = 'strong' | 'adequate' | 'short'
export type Direction = 'better' | 'worse'
export type Topic = 'power' | 'water' | 'land' | 'community'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Assumptions {
  launch_cost_per_kg?: number
  power_price_multiplier?: number
  cooling?: Cooling
}

// ---- 1. Search -> ranking ----
export interface RankRequest {
  capacity_mw: number
  ready_by_year: number
  priority: Priority
  assumptions?: Assumptions
}

export interface Risk {
  water: number
  grid: number
  crowding: number
  opposition: number
  overall: number
}

export interface RankOption {
  id: string
  name: string
  kind: 'earth' | 'orbit'
  lat: number
  lng: number
  score: number
  rank: number
  cost_per_mw_year: number
  time_to_power_years: number
  risk: Risk
  labor: Labor
  reason: string
  badges: string[]
  has_parcels: boolean
}

export interface RankResponse {
  options: RankOption[]
  break_even: { versus_id: string; launch_cost_per_kg: number; text: string }
}

// ---- 2. Region detail ----
export interface Breakdown {
  build_cost_usd: number
  annual_operating_cost_usd: number
  facility_power_mw: number
  cooling_load_mw: number
  annual_water_liters: number
  water_household_equivalent: number
  annual_energy_mwh: number
  // orbit only
  solar_array_m2?: number
  radiator_m2?: number
  launch_mass_kg?: number
  launch_cost_usd?: number
}

export interface ParcelSummary {
  id: string
  name: string
  verdict: Verdict
  lat: number
  lng: number
}

export interface Region {
  id: string
  name: string
  /** Not in contract v1 yet — proposed so the detail header can show the score. */
  score?: number
  breakdown: Breakdown
  risk_notes: { factor: string; text: string }[]
  parcels: ParcelSummary[]
}

// ---- 3. Parcel verdict ----
export interface Check {
  name: string
  status: CheckStatus
  text: string
}

export interface Parcel {
  id: string
  region_id: string
  address: string
  lat: number
  lng: number
  acres: number
  asking_price_per_acre: number
  image_url: string
  checks: Check[]
  verdict: Verdict
  max_price_per_acre: number
  reason: string
  matterport_model_id: string | null
  sources: string[]
}

// ---- 4. Watchlist ----
export interface WatchChange {
  date: string
  text: string
  direction: Direction
}

export interface WatchItem {
  kind: 'region' | 'parcel'
  id: string
  name: string
  current: { verdict?: Verdict; score?: number }
  changes: WatchChange[]
}

export interface Watchlist {
  items: WatchItem[]
}

// ---- 5. Investigation report ----
export interface ReportSection {
  topic: Topic
  finding: string
  risk: RiskLevel
  sources: { title: string; url: string }[]
}

export interface Report {
  report_id: string
  status: 'running' | 'done' | 'failed'
  site: { kind: 'region' | 'parcel'; id: string; name: string }
  summary: string
  sections: ReportSection[]
  changes_since_last: string[]
  generated_at: string
}
