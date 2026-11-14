// Pure helpers for the parcel price bar (kept separate so they're unit-tested).

export interface PriceBarLayout {
  /** 0–100: where the asking-price marker sits */
  askPct: number
  /** 0–100: where the walk-away (max) price sits; the green zone ends here */
  maxPct: number
  /** true when asking ≤ max */
  withinBudget: boolean
  /** asking − max, positive when over budget */
  gapPerAcre: number
}

/** Lays out asking vs. max price on one 0..scale axis with ~20% headroom. Returns null when there's no max (Pass). */
export function priceBarLayout(asking: number, max: number): PriceBarLayout | null {
  if (!(max > 0) || !(asking >= 0)) return null
  const scale = Math.max(asking, max) * 1.2
  const pct = (v: number) => Math.min(100, Math.max(0, (v / scale) * 100))
  return {
    askPct: pct(asking),
    maxPct: pct(max),
    withinBudget: asking <= max,
    gapPerAcre: asking - max,
  }
}

/** $145k, $3.1M — compact labels for the bar. */
export function usdShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1e3) return `$${Math.round(n / 1e3)}k`
  return `$${Math.round(n)}`
}
