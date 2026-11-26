import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ApiError, api, apiBlob } from '../lib/api'
import { usePolling } from '../lib/usePolling'
import type { Complaint, Wrapped } from '../types'

export default function ComplaintDetail() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    try {
      const result = await api<Wrapped<Complaint>>(`/complaints/${id}`)
      setComplaint(result.data)
      setError(null)
    } catch (err) {
      if (silent) return
      if (err instanceof ApiError && err.status === 403) setError('You cannot view this complaint.')
      else if (err instanceof ApiError && err.status === 404) setError('Complaint not found.')
      else setError('Could not load the complaint.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  usePolling(() => load(true))

  // The photo needs the bearer token, so fetch it as a file and show it from memory.
  const hasPhoto = complaint?.has_photo ?? false
  useEffect(() => {
    if (!hasPhoto) return

    let url: string | null = null
    let cancelled = false

    apiBlob(`/complaints/${id}/photo`)
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setPhotoUrl(url)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [hasPhoto, id])

  async function sendComment(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setCommentError(null)

    try {
      await api(`/complaints/${id}/comments`, { method: 'POST', body: { body } })
      setBody('')
      await load(true)
    } catch (err) {
      if (err instanceof ApiError) setCommentError(err.errors.body?.[0] ?? err.message)
      else setCommentError('Could not send the comment.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading complaint…</p>
  }

  if (error || !complaint) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Complaint not found.'}</p>
        <Link to="/complaints" className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800">← Back to complaints</Link>
      </div>
    )
  }

  const comments = complaint.comments ?? []

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link to="/complaints" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <span aria-hidden="true">←</span> All complaints
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium capitalize text-brand-700">{complaint.category.replace('_', ' ')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{complaint.title}</h1>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{complaint.description}</p>
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Attached to the complaint"
              className="mt-5 max-h-[480px] w-auto max-w-full rounded-xl border border-slate-200 object-contain"
            />
          )}
        </div>
      </article>

      <section aria-labelledby="comments-heading">
        <div className="mb-3">
          <h2 id="comments-heading" className="text-lg font-semibold text-slate-900">Comments</h2>
          <p className="mt-1 text-sm text-slate-500">Updates and replies about this issue.</p>
        </div>

        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {comment.author?.name || 'Community team'}
                  {comment.author?.role && <span className="ml-2 font-normal capitalize text-slate-500">{comment.author.role}</span>}
                </p>
                <time dateTime={comment.created_at} className="text-xs text-slate-400">
                  {new Date(comment.created_at).toLocaleString('en-MY')}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
              No comments yet.
            </li>
          )}
        </ul>
      </section>

      {complaint.status === 'closed' ? (
        <p className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
          This complaint is closed, so new comments are turned off.
        </p>
      ) : (
        <form onSubmit={sendComment} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="complaint-comment" className="block text-sm font-semibold text-slate-900">Add a comment</label>
          <textarea
            id="complaint-comment"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write an update or reply…"
            rows={4}
            required
            className="mt-3 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
          />
          {commentError && <p role="alert" className="mt-2 text-sm text-red-700">{commentError}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send comment'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
