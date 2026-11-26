import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import type { Complaint, Wrapped } from '../types'

// Replace with the values in app/Enums/ComplaintCategory.php
const CATEGORIES = ['maintenance', 'noise', 'security', 'cleanliness', 'other']

export default function NewComplaint() {
  const navigate = useNavigate()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [unitId, setUnitId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})

    const form = new FormData()
    form.append('category', category)
    form.append('title', title)
    form.append('description', description)
    if (photo) form.append('photo', photo)
    if (unitId) form.append('unit_id', unitId)

    try {
      const result = await api<Wrapped<Complaint>>('/complaints', { method: 'POST', body: form })
      navigate(`/complaints/${result.data.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.errors)
      } else {
        setError('Could not file the complaint.')
      }
    } finally {
      setBusy(false)
    }
  }

  const fieldClass = 'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
  const labelClass = 'block text-sm font-medium text-slate-700'
  const fieldErrorClass = 'mt-1.5 block text-sm font-normal text-red-700'

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/complaints" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <span aria-hidden="true">←</span> Complaints
      </Link>

      <div className="mb-6 mt-5">
        <p className="text-sm font-medium text-brand-700">Community</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">File a complaint</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Tell us what’s going on and the team will follow up.</p>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label className={labelClass}>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={`${fieldClass} capitalize`}>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {fieldErrors.category && <span className={fieldErrorClass}>{fieldErrors.category[0]}</span>}
        </label>

        <label className={labelClass}>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Briefly describe the issue"
            className={fieldClass}
            required
          />
          {fieldErrors.title && <span className={fieldErrorClass}>{fieldErrors.title[0]}</span>}
        </label>

        <label className={labelClass}>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add any details that will help us understand and resolve it."
            rows={5}
            className={`${fieldClass} resize-y leading-6`}
            required
          />
          {fieldErrors.description && <span className={fieldErrorClass}>{fieldErrors.description[0]}</span>}
        </label>

        <label className={labelClass}>
          Photo <span className="font-normal text-slate-400">(optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100"
          />
          {fieldErrors.photo && <span className={fieldErrorClass}>{fieldErrors.photo[0]}</span>}
        </label>

        {/* Only residents of two units are asked which one; the API replies with a unit_id error. */}
        {fieldErrors.unit_id && (
          <label className={labelClass}>
            Unit ID
            <input value={unitId} onChange={(event) => setUnitId(event.target.value)} className={fieldClass} required />
            <span className={fieldErrorClass}>{fieldErrors.unit_id[0]}</span>
          </label>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Link to="/complaints" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Submit complaint'}
          </button>
        </div>
      </form>
    </section>
  )
}
