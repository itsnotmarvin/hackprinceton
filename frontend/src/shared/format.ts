// Number formatting helpers. SHARED FILE.

export function usd(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export function usdExact(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export function num(n: number, digits = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function liters(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} billion L`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} million L`
  return `${num(n)} L`
}
