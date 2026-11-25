import { useAuth } from '../auth/auth-context'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Hello, {user?.name}</h1>
      <p className="mt-1 text-slate-500">Signed in as {user?.role}</p>
      <button
        onClick={logout}
        className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
      >
        Sign out
      </button>
    </main>
  )
}