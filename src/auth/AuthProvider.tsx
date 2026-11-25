import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore, UNAUTHORIZED_EVENT } from '../lib/api'
import type { User } from '../types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Only "loading" if there is a saved token we need to check
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  // Restore the session after a page refresh
  useEffect(() => {
    if (tokenStore.get() === null) return

    api<User>('/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  // Any 401 from anywhere in the app logs the user out
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: { email, password },
    })
    tokenStore.set(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' })
    } catch {
      // The token may already be invalid; we clear it either way
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}