import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useUnreadCount } from '../notifications/useUnreadCount'

export interface LayoutContext {
  refreshUnread: () => Promise<void>
}

export interface LayoutContext {
  refreshUnread: () => Promise<void>
  unreadCount: number
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { count, refresh } = useUnreadCount()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  function confirmLogout() {
    setLogoutDialogOpen(false)
    void logout()
  }
  

  return (
    <div className="min-h-screen bg-brand-50/60 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-5 sm:gap-8">
            <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-md">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white">
                M
              </span>
              <span className="text-base font-semibold tracking-tight">MyCondo</span>
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1">
              <NavLink to="/" end className={navClass}>Home</NavLink>
              <NavLink to="/invoices" className={navClass}>Invoices</NavLink>
              <NavLink to="/bookings" className={navClass}>Bookings</NavLink>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/notifications"
              aria-label={`Notifications, ${count} unread`}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            <span className="hidden max-w-36 truncate text-sm text-slate-600 sm:inline">{user?.name}</span>
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
        <Outlet context={{ refreshUnread: refresh, unreadCount: count } satisfies LayoutContext} />
      </main>

      {logoutDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setLogoutDialogOpen(false)
        }}>
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 id="logout-dialog-title" className="text-lg font-semibold tracking-tight text-slate-900">
              Sign out of MyCondo?
            </h2>
            <p id="logout-dialog-description" className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to sign out?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setLogoutDialogOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              >
                Yes, sign out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
