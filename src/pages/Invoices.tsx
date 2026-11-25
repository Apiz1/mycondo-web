import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDate, formatPeriod, money } from '../lib/format'
import type { Invoice, Paginated } from '../types'

const FILTERS = ['all', 'unpaid', 'overdue', 'paid'] as const
type Filter = (typeof FILTERS)[number]

export default function Invoices() {
  const [filter, setFilter] = useState<Filter>('all')
  const [items, setItems] = useState<Invoice[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number, status: Filter) => {
    setLoading(true)
    setError(null)

    try {
      const query = `?page=${pageNumber}${status === 'all' ? '' : `&status=${status}`}`
      const result = await api<Paginated<Invoice>>(`/invoices${query}`)

      setItems((previous) => (pageNumber === 1 ? result.data : [...previous, ...result.data]))
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
    } catch {
      setError('Could not load your invoices.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1, filter)
  }, [filter, load])

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-700">Payments</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Invoices</h1>
          <p className="mt-2 text-sm text-slate-500">Review your fees and payment status.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filter invoices">
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
            {value}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.map((invoice) => (
          <li key={invoice.id}>
            <Link
              to={`/invoices/${invoice.id}`}
              className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{formatPeriod(invoice.period)}</p>
                <p className="mt-1 text-sm text-slate-500">Due {formatDate(invoice.due_date)}</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="font-semibold tabular-nums text-slate-900">{money(invoice.amount)}</span>
                <StatusBadge status={invoice.status} />
                <svg viewBox="0 0 20 20" className="hidden h-4 w-4 text-slate-400 sm:block" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </li>
        ))}

        {!loading && items.length === 0 && !error && (
          <li className="px-5 py-14 text-center sm:px-6">
            <p className="font-medium text-slate-800">No invoices found</p>
            <p className="mt-1 text-sm text-slate-500">There are no invoices in this category right now.</p>
          </li>
        )}

        {loading && items.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">Loading invoices…</li>
        )}
      </ul>

      {loading && items.length > 0 && <p className="mt-4 text-center text-sm text-slate-500">Loading…</p>}

      {!loading && page < lastPage && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => load(page + 1, filter)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            Load more invoices
          </button>
        </div>
      )}
    </section>
  )
}
