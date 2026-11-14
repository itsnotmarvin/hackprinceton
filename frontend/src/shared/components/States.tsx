export function Loading({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="state">
      <span className="spinner" /> <span style={{ marginLeft: 8 }}>{text}</span>
    </div>
  )
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="state">
      <p>Something went wrong.</p>
      <p className="small">{error.message}</p>
    </div>
  )
}
