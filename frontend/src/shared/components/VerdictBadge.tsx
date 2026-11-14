import type { Verdict } from '../types'

const LABEL: Record<Verdict, string> = { buy: 'Buy', maybe: 'Maybe', pass: 'Pass' }

export function VerdictBadge({ verdict, large = false }: { verdict: Verdict; large?: boolean }) {
  return <span className={`verdict verdict-${verdict}${large ? ' verdict-lg' : ''}`}>{LABEL[verdict]}</span>
}
