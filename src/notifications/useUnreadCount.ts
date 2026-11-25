import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useUnreadCount(intervalMs = 30_000) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const result = await api<{ count: number }>('/notifications/unread-count')
      setCount(result.count)
    } catch {
      // A failed poll is not worth interrupting the user for
    }
  }, [])

  useEffect(() => {
    void refresh()

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [refresh, intervalMs])

  return { count, refresh }
}