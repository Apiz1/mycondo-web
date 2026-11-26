import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ApiError, api } from '../lib/api'
import type { Booking, Paginated, Wrapped } from '../types'
import { usePolling } from '../lib/usePolling'

export default function Bookings() {
  const [items, setItems] = useState<Booking[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)

  const load = useCallback(async (pageNumber: number, silent = false) => {
  if (!silent) {
    setLoading(true)
    setError(null)
  }
  try {
    const result = await api<Paginated<Booking>>(`/bookings?page=${pageNumber}`)
    setItems((prev) => (pageNumber === 1 ? result.data : [...prev, ...result.data]))
    setPage(result.meta.current_page)
    setLastPage(result.meta.last_page)
  } catch {
    if (!silent) setError('Could not load your bookings.')
  } finally {
    if (!silent) setLoading(false)
  }
}, [])

  useEffect(() => {
    void load(1)
  }, [load])

  usePolling(() => {
  if (page === 1) void load(1, true) // don't disturb someone who pressed "Load more"
})

  async function cancel(id: number) {
    try {
      const result = await api<Wrapped<Booking>>(`/bookings/${id}/cancel`, { method: 'POST' })
      setItems((previous) => previous.map((booking) => (booking.id === id ? { ...booking, ...result.data } : booking)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel the booking.')
    }
  }

  const canCancel = (booking: Booking) =>
    (booking.status === 'pending' || booking.status === 'approved') && new Date(booking.start_at) > new Date()

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-700">Facilities</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">My bookings</h1>
          <p className="mt-2 text-sm text-slate-500">View and manage your facility reservations.</p>
        </div>
        <Link
          to="/bookings/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
          New booking
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {items.map((booking) => (
          <li key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    {booking.facility?.name || 'Facility booking'}
                  </h2>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  <time dateTime={booking.start_at}>{new Date(booking.start_at).toLocaleString('en-MY')}</time>
                  {' '}to{' '}
                  {new Date(booking.end_at).toLocaleTimeString('en-MY')}
                </p>
                {booking.purpose && <p className="mt-3 text-sm leading-6 text-slate-500">{booking.purpose}</p>}
                {booking.status === 'rejected' && booking.review_note && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {booking.review_note}</p>
                )}
              </div>

              {canCancel(booking) && (
                <button
                  type="button"
                  onClick={() => setBookingToCancel(booking)}
                  className="w-fit rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                >
                  Cancel booking
                </button>
              )}
            </div>
          </li>
        ))}

        {!loading && items.length === 0 && !error && (
          <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-4 font-medium text-slate-900">No bookings yet</p>
            <p className="mt-1 text-sm text-slate-500">Your facility reservations will show up here.</p>
            <Link to="/bookings/new" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
              Make a booking
            </Link>
          </li>
        )}

        {loading && items.length === 0 && (
          <li className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">Loading bookings…</li>
        )}
      </ul>

      {loading && items.length > 0 && <p className="mt-4 text-center text-sm text-slate-500">Loading…</p>}

      {bookingToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBookingToCancel(null)
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            aria-describedby="cancel-booking-description"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="cancel-booking-title" className="text-lg font-semibold tracking-tight text-slate-900">
              Cancel this booking?
            </h2>
            <p id="cancel-booking-description" className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to cancel your booking for {bookingToCancel.facility?.name || 'this facility'}?
              {` `}This action may not be reversible.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setBookingToCancel(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              >
                Keep booking
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = bookingToCancel
                  setBookingToCancel(null)
                  void cancel(booking.id)
                }}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20"
              >
                Yes, cancel
              </button>
            </div>
          </section>
        </div>
      )}
      {!loading && page < lastPage && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => void load(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          >
            Load more bookings
          </button>
        </div>
      )}
    </section>
  )
}



