import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void | Promise<void>, intervalMs = 10_000) {
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void latest.current()
    }

    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick) // refresh when you return to the tab

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
}