export function money(amount: string | number): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(Number(amount))
}

// "2026-11" → "November 2026"
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
}

// "2026-11-15" → "15 Nov 2026", parsed as a plain date so time zones can't shift it
export function formatDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}