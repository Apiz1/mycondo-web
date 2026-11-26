import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { halfHourSlots } from '../lib/slots'
import type { Availability, Facility, Wrapped } from '../types'

export default function NewBooking() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityId] = useState('')
  const [date, setDate] = useState('')
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    api<Wrapped<Facility[]>>('/facilities')
      .then((result) => setFacilities(result.data))
      .catch(() => setError('Could not load facilities.'))
  }, [])

  // Re-check availability whenever the selected facility or date changes.
  useEffect(() => {
    if (!facilityId || !date) return

    let ignore = false
    api<Availability>(`/facilities/${facilityId}/availability?date=${date}`)
      .then((result) => {
        if (!ignore) setAvailability(result)
      })
      .catch(() => {
        if (!ignore) setError('Could not load availability.')
      })

    return () => {
      ignore = true
    }
  }, [facilityId, date])

  const facility = facilities.find((item) => String(item.id) === facilityId)
  const slots = availability && facility ? halfHourSlots(availability.open_time, availability.close_time) : []
  const today = new Date().toLocaleDateString('en-CA')
  const fieldClass = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
  const labelClass = 'block text-sm font-medium text-slate-700'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})

    try {
      await api(`/facilities/${facilityId}/bookings`, {
        method: 'POST',
        body: { date, start_time: start, end_time: end, purpose: purpose || null },
      })
      navigate('/bookings')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.errors)
      } else {
        setError('Could not create the booking.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/bookings" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <span aria-hidden="true">←</span> My bookings
      </Link>

      <div className="mb-6 mt-5">
        <p className="text-sm font-medium text-brand-700">Facilities</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">New booking</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Choose a facility and time that works for you.</p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Facility
            <select
              value={facilityId}
              onChange={(event) => { setFacilityId(event.target.value); setAvailability(null) }}
              className={fieldClass}
              required
            >
              <option value="">Choose a facility</option>
              {facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <label className={labelClass}>
            Date
            <input
              type="date"
              min={today}
              value={date}
              onChange={(event) => { setDate(event.target.value); setAvailability(null) }}
              className={fieldClass}
              required
            />
            {fieldErrors.date && <span className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.date[0]}</span>}
          </label>
        </div>

        {facility && (
          <div className="rounded-xl bg-brand-50/70 px-4 py-3.5 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{facility.name}</p>
            <p className="mt-1 leading-6">
              Open {facility.open_time.slice(0, 5)} to {facility.close_time.slice(0, 5)} · Up to {facility.max_duration_minutes} minutes
              {facility.needs_approval && <span> · Committee approval required</span>}
            </p>
          </div>
        )}

        {facility && date && availability && (
          <div className="space-y-5 border-t border-slate-100 pt-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Choose a time</h2>
              <p className="mt-1 text-sm text-slate-500">Select a start and end time for your reservation.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <h3 className="text-sm font-medium text-slate-800">Already booked</h3>
              {availability.booked.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {availability.booked.map((booking, index) => (
                    <li key={index} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700">{booking.start_at} to {booking.end_at}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize text-slate-500">{booking.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Nothing booked on this day.</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>
                From
                <select value={start} onChange={(event) => setStart(event.target.value)} className={fieldClass} required>
                  <option value="">Choose start time</option>
                  {slots.slice(0, -1).map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
                {fieldErrors.start_time && <span className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.start_time[0]}</span>}
              </label>

              <label className={labelClass}>
                To
                <select value={end} onChange={(event) => setEnd(event.target.value)} className={fieldClass} required>
                  <option value="">Choose end time</option>
                  {slots.filter((slot) => slot > start).map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                </select>
                {fieldErrors.end_time && <span className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.end_time[0]}</span>}
              </label>
            </div>

            <label className={labelClass}>
              Purpose <span className="font-normal text-slate-400">(optional)</span>
              <input
                type="text"
                maxLength={200}
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="What is the booking for?"
                className={fieldClass}
              />
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Link to="/bookings" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        )}
      </form>
    </section>
  )
}
