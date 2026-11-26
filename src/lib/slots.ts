// "08:00", "22:00" -> ["08:00", "08:30", ..., "22:00"]
export function halfHourSlots(open: string, close: string): string[] {
  const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const slots: string[] = []

  for (let m = toMinutes(open); m <= toMinutes(close); m += 30) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  return slots
}