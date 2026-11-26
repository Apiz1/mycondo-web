import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '../components/AppLayout'
import { api } from '../lib/api'
import { timeAgo } from '../lib/time'
import type { AppNotification, Paginated } from '../types'

type Filter = 'all' | 'unread'

export default function Notifications() {
  const { refreshUnread, unreadCount } = useOutletContext<LayoutContext>()

  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<AppNotification[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number, unreadOnly: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const query = `?page=${pageNumber}${unreadOnly ? '&unread=1' : ''}`
      const result = await api<Paginated<AppNotification>>(`/notifications${query}`)

      setItems((previous) => (pageNumber === 1 ? result.data : [...previous, ...result.data]))
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
    } catch {
      setError('Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1, filter === 'unread')
  }, [filter, load])

  const previousCount = useRef(unreadCount)

  useEffect(() => {
    // A new notification arrived: reload the first page
    if (unreadCount > previousCount.current) {
      void load(1, filter === 'unread')
    }
    previousCount.current = unreadCount
  }, [unreadCount, filter, load])

  async function markRead(notification: AppNotification) {
    if (notification.read_at) return

    try {
      const updated = await api<AppNotification>(`/notifications/${notification.id}/read`, { method: 'PATCH' })
      setItems((previous) => previous.map((n) => (n.id === updated.id ? updated : n)))
      void refreshUnread()
    } catch {
      setError('Could not mark it as read.')
    }
  }

  async function markAllRead() {
    try {
      await api('/notifications/read-all', { method: 'POST' })
      await load(1, filter === 'unread')
      void refreshUnread()
    } catch {
      setError('Could not mark all as read.')
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>

        <div className="flex items-center gap-2">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                filter === value ? 'bg-slate-900 text-white' : 'border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {value}
            </button>
          ))}
          <button
            onClick={markAllRead}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => markRead(n)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                n.read_at ? '' : 'bg-indigo-50/60'
              }`}
            >
              <span
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-indigo-600'}`}
                aria-label={n.read_at ? 'Read' : 'Unread'}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-900">{n.title}</span>
                <span className="block text-sm text-slate-600">{n.message}</span>
              </span>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.created_at)}</span>
            </button>
          </li>
        ))}

        {!loading && items.length === 0 && (
          <li className="px-4 py-10 text-center text-slate-500">
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
          </li>
        )}
      </ul>

      {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

      {!loading && page < lastPage && (
        <button
          onClick={() => load(page + 1, filter === 'unread')}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Load more
        </button>
      )}
    </section>
  )
}