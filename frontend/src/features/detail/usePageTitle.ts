import { useEffect } from 'react'

/** Sets the browser tab title while the page is mounted. */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return
    const prev = document.title
    document.title = `${title} · Site Finder`
    return () => {
      document.title = prev
    }
  }, [title])
}
