import type { AvailabilityRule, Booking } from '@/lib/clyde/types'

export function slotsForDay(rules: AvailabilityRule[], date: Date): string[] {
  const out = new Set<string>()
  for (const rule of rules) {
    if (rule.day_of_week !== date.getDay()) continue
    const [startHour, startMinute] = rule.start_time.split(':').map(Number)
    const [endHour, endMinute] = rule.end_time.split(':').map(Number)
    let current = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute
    while (current + rule.slot_duration_minutes <= end) {
      out.add(`${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`)
      current += rule.slot_duration_minutes
    }
  }
  return [...out].sort()
}

export function slotStepForDay(rules: AvailabilityRule[], date: Date): number | null {
  const steps = rules
    .filter((rule) => rule.day_of_week === date.getDay())
    .map((rule) => rule.slot_duration_minutes)
  return steps.length ? Math.min(...steps) : null
}

export function bookedRangesForDay(
  bookings: Booking[],
  businessId: string,
  date: Date,
  fallbackMinutes: number,
): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  for (const booking of bookings) {
    if (booking.business_id !== businessId) continue
    if (booking.status !== 'pending' && booking.status !== 'confirmed') continue
    const start = new Date(booking.start_at)
    if (
      start.getFullYear() !== date.getFullYear()
      || start.getMonth() !== date.getMonth()
      || start.getDate() !== date.getDate()
    ) continue
    const from = start.getHours() * 60 + start.getMinutes()
    ranges.push([from, from + (booking.duration_minutes ?? fallbackMinutes)])
  }
  return ranges
}

export function freeSlotsForDay(
  rules: AvailabilityRule[],
  date: Date,
  bookings: Booking[],
  businessId: string,
  durationMinutes?: number,
): string[] {
  const all = slotsForDay(rules, date)
  if (!all.length) return all
  const step = slotStepForDay(rules, date) ?? 60
  const span = durationMinutes ?? step
  const taken = bookedRangesForDay(bookings, businessId, date, step)
  return all.filter((slot) => {
    const [hour, minute] = slot.split(':').map(Number)
    const from = hour * 60 + minute
    const to = from + span
    return !taken.some(([bookedFrom, bookedTo]) => from < bookedTo && to > bookedFrom)
  })
}
