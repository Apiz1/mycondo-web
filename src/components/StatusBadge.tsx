const STYLES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  unpaid: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STYLES[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}