import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ApiError, api } from '../lib/api'
import { formatDate, formatPeriod, money } from '../lib/format'
import type { Invoice, Payment, Wrapped } from '../types'

export default function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [formKey, setFormKey] = useState(0)

  const load = useCallback(async () => {
    try {
      const result = await api<Wrapped<Invoice>>(`/invoices/${id}`)
      setInvoice(result.data)
      setError(null)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError('You cannot view this invoice.')
      else if (err instanceof ApiError && err.status === 404) setError('Invoice not found.')
      else setError('Could not load the invoice.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function payOnline() {
    setBusy(true)
    setActionError(null)

    try {
      const result = await api<Wrapped<Payment>>(`/invoices/${id}/pay/billplz`, { method: 'POST' })
      if (result.data.payment_url) {
        window.location.assign(result.data.payment_url)
        return
      }
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not start the payment.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadProof(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setActionError('Choose your payment slip first.')
      return
    }

    const form = new FormData()
    form.append('proof', file)
    if (note.trim()) form.append('note', note.trim())

    setBusy(true)
    setActionError(null)

    try {
      await api(`/invoices/${id}/payments`, { method: 'POST', body: form })
      setFile(null)
      setNote('')
      setFormKey((key) => key + 1)
      await load()
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.errors.proof?.[0] ?? err.message)
      else setActionError('Could not upload the slip.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading invoice…</p>
  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Invoice not found.'}</p>
        <Link to="/invoices" className="mt-4 inline-flex text-sm font-medium text-brand-700 hover:text-brand-800">← Back to invoices</Link>
      </div>
    )
  }

  const payments = invoice.payments ?? []
  const pending = payments.find((payment) => payment.status === 'pending')
  const latest = payments[0]
  const rejected = !pending && latest?.status === 'rejected' ? latest : null
  const panelClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'
  const buttonClass = 'rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <span aria-hidden="true">←</span> All invoices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-medium text-brand-700">Invoice</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{formatPeriod(invoice.period)}</h1>
          <p className="mt-2 text-sm text-slate-500">Due {formatDate(invoice.due_date)}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold tabular-nums text-slate-900">{money(invoice.amount)}</p>
          <div className="mt-2"><StatusBadge status={invoice.status} /></div>
        </div>
      </div>

      {invoice.status === 'paid' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 sm:p-6">
          <p className="font-semibold">This invoice is paid</p>
          <p className="mt-1 text-sm text-emerald-800">Thank you. Your payment has been recorded.</p>
        </div>
      ) : pending ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          {pending.method === 'billplz' ? (
            <>
              <p className="font-semibold text-amber-950">Your online payment has been started</p>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">Finish it on the payment page. This invoice will update here once the payment is confirmed.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={payOnline} disabled={busy} className={`${buttonClass} bg-brand-600 text-white hover:bg-brand-700`}>
                  {busy ? 'Please wait…' : 'Continue to payment'}
                </button>
                <button onClick={load} className={`${buttonClass} border border-amber-300 bg-white text-slate-700 hover:bg-amber-100`}>Refresh status</button>
              </div>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-950">Your payment slip is waiting for review</p>
              <p className="mt-1 text-sm leading-6 text-amber-900/80">The committee will approve or reject it. You will get a notification.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rejected && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
              <p className="font-semibold text-red-900">Your last payment was rejected</p>
              {rejected.review_note && <p className="mt-1 text-sm text-red-800">Reason: {rejected.review_note}</p>}
              <p className="mt-1 text-sm text-red-800">You can submit another payment below.</p>
            </div>
          )}

          {actionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className={panelClass}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-13 5h3" strokeLinecap="round" /></svg>
              </div>
              <h2 className="mt-4 font-semibold text-slate-900">Pay online</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Pay securely through Billplz.</p>
              <button onClick={payOnline} disabled={busy} className={`${buttonClass} mt-5 bg-brand-600 text-white hover:bg-brand-700`}>
                {busy ? 'Please wait…' : `Pay ${money(invoice.amount)}`}
              </button>
            </div>

            <form key={formKey} onSubmit={uploadProof} className={panelClass}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m-4 4 4-4 4 4M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h2 className="mt-4 font-semibold text-slate-900">Bank transfer</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Transfer the amount, then upload your slip for review.</p>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Payment slip
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Note <span className="font-normal text-slate-400">(optional)</span>
                <input
                  type="text"
                  placeholder="Add a short note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </label>
              <button type="submit" disabled={busy} className={`${buttonClass} mt-4 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
                {busy ? 'Uploading…' : 'Submit slip'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
          <p className="mt-1 text-sm text-slate-500">Previous payment attempts for this invoice.</p>
        </div>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div>
                <p className="font-medium text-slate-900">
                  {payment.method === 'billplz' ? 'Online (Billplz)' : 'Bank transfer'} · {money(payment.amount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">Submitted {new Date(payment.submitted_at).toLocaleString('en-MY')}</p>
                {payment.status === 'rejected' && payment.review_note && <p className="mt-1 text-sm text-red-700">Reason: {payment.review_note}</p>}
              </div>
              <StatusBadge status={payment.status} />
            </li>
          ))}
          {payments.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500 sm:px-6">No payments yet.</li>}
        </ul>
      </div>
    </section>
  )
}
