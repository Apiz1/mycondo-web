import { Link } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'

export default function Home() {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0]

  return (
    <div className="mx-auto max-w-5xl">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-brand-700">Resident portal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Good to see you{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Your MyCondo account is ready. Check your community updates whenever you need them.
            </p>
          </div>
          <Link
            to="/notifications"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
          >
            View notifications
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="account-heading">
        <div className="mb-3">
          <h2 id="account-heading" className="text-base font-semibold text-slate-900">Your account</h2>
          <p className="mt-1 text-sm text-slate-500">The details associated with your sign-in.</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700" aria-hidden="true">
            {user?.name?.trim().charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{user?.name || 'MyCondo resident'}</p>
            <p className="mt-1 text-sm capitalize text-slate-500">{user?.role || 'Resident'}</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            Signed in
          </span>
        </div>
      </section>
    </div>
  )
}
