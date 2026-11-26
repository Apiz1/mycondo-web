import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { usePolling } from '../lib/usePolling'
import type { Complaint, Paginated } from '../types'

const FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const
type Filter = (typeof FILTERS)[number]

export default function Complaints() {
  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<Complaint[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number, status: Filter, silent = false) => {
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const query = `?page=${pageNumber}${status === 'all' ? '' : `&status=${status}`}`
      const result = await api<Paginated<Complaint>>(`/complaints${query}`)
      setItems((previous) => (pageNumber === 1 ? result.data : [...previous, ...result.data]))
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
    } catch {
      if (!silent) setError('Could not load complaints.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1, filter)
  }, [filter, load])

  usePolling(() => {
    if (page === 1) void load(1, filter, true)
  })

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-700">Community</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Complaints</h1>
          <p className="mt-2 text-sm text-slate-500">Raise an issue and follow its progress.</p>
        </div>
        <Link
          to="/complaints/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
          File a complaint
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter complaints">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition focus:outline-none focus:ring-4 focus:ring-brand-500/10 ${
              filter === value
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {value.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {items.map((complaint) => (
          <li key={complaint.id}>
            <Link
              to={`/complaints/${complaint.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:px-6"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">{complaint.title}</h2>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="mt-1.5 text-sm capitalize text-slate-500">{complaint.category.replace('_', ' ')}</p>
              </div>
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}

        {!loading && items.length === 0 && !error && (
          <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M5 4h14v13H8l-3 3V4Z" strokeLinejoin="round" />
                <path d="M9 9h6m-6 4h4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-slate-900">No complaints found</p>
            <p className="mt-1 text-sm text-slate-500">There are no complaints in this category.</p>
            {filter === 'all' && (
              <Link to="/complaints/new" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
                File a complaint
              </Link>
            )}
          </li>
        )}

        {loading && items.length === 0 && (
          <li className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">Loading complaints…</li>
        )}
      </ul>

      {loading && items.length > 0 && <p className="mt-4 text-center text-sm text-slate-500">Loading…</p>}

      {!loading && page < lastPage && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => void load(page + 1, filter)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            Load more complaints
          </button>
        </div>
      )}
    </section>
  )
}
