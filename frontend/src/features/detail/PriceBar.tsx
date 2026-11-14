import { usdExact } from '../../shared/format'
import { priceBarLayout, usdShort } from './price'

/** Asking price vs. walk-away price, per acre. Green zone = worth buying. */
export function PriceBar({ asking, max, acres }: { asking: number; max: number; acres: number }) {
  const l = priceBarLayout(asking, max)
  if (!l) return null

  return (
    <div className="pricebar">
      <div className="pricebar-head">
        <h2>Price check</h2>
        <span className={l.withinBudget ? 'pricebar-ok' : 'pricebar-over'}>
          {l.withinBudget
            ? `${usdShort(-l.gapPerAcre)}/acre under the walk-away price`
            : `${usdShort(l.gapPerAcre)}/acre over the walk-away price`}
        </span>
      </div>

      <div
        className="pricebar-track"
        role="img"
        aria-label={`Asking ${usdExact(asking)} per acre; worth up to ${usdExact(max)} per acre`}
      >
        <div className="pricebar-good" style={{ width: `${l.maxPct}%` }} />
        <div className="pricebar-max" style={{ left: `${l.maxPct}%` }}>
          <span>Walk away above {usdShort(max)}</span>
        </div>
        <div className={`pricebar-ask ${l.withinBudget ? 'ok' : 'over'}`} style={{ left: `${l.askPct}%` }}>
          <span>Asking {usdShort(asking)}</span>
        </div>
      </div>

      <p className="muted small">
        At the walk-away price the whole parcel costs {usdExact(max * acres)}; the seller is asking{' '}
        {usdExact(asking * acres)}.
      </p>
    </div>
  )
}
