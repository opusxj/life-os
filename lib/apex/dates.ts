// The house date vocabulary.
//
// Dates in this app are read as language, not scanned as codes, so they carry
// ordinals ("2nd August") and spell their months out. Abbreviation is a
// concession to width, never a default: only genuinely dense surfaces (table
// cells, chart axes) shorten the month, and even those keep the ordinal.

const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { month: "long" })
const MONTH_SHORT = new Intl.DateTimeFormat("en-GB", { month: "short" })
const WEEKDAY_LONG = new Intl.DateTimeFormat("en-GB", { weekday: "long" })
const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-GB", { weekday: "short" })

/** yyyy-mm-dd → local midnight, so month arithmetic never drifts a day */
export function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}

/** The server clock as a yyyy-mm-dd key, from local parts to match parseDay */
export function todayKey(): string {
  return dayKeyAgo(0)
}

/** The local date `days` ago as a yyyy-mm-dd key */
export function dayKeyAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 1 → "1st", 2 → "2nd", 11 → "11th", 22 → "22nd" */
export function ordinal(day: number): string {
  const teens = day % 100
  if (teens >= 11 && teens <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/**
 * Every formatter here takes a yyyy-mm-dd key or a Date and yields the
 * no-value dash for anything unparseable: Intl throws a RangeError on an
 * Invalid Date, which would take a whole page down over one bad column.
 */
function resolve(date: string | Date): Date | null {
  const value = typeof date === "string" ? parseDay(date) : date
  return Number.isNaN(value.getTime()) ? null : value
}

/** "2026-08-02" → "2nd August 2026". The default for prose and card copy. */
export function formatFullDate(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${ordinal(value.getDate())} ${MONTH_LONG.format(value)} ${value.getFullYear()}`
}

/** "2026-08-02" → "2nd August". When the year is obvious from context. */
export function formatDayMonth(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${ordinal(value.getDate())} ${MONTH_LONG.format(value)}`
}

/** "2026-08-02" → "2nd Aug". Dense surfaces only: table cells, tight badges. */
export function formatDayMonthShort(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${ordinal(value.getDate())} ${MONTH_SHORT.format(value)}`
}

/** "2026-08-02" → "2nd Aug 2026". Dense surfaces spanning more than a year. */
export function formatDayMonthYearShort(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${ordinal(value.getDate())} ${MONTH_SHORT.format(value)} ${value.getFullYear()}`
}

/** "2026-08-02" → "August". Bare month, when the year is obvious from context. */
export function formatMonth(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return MONTH_LONG.format(value)
}

/** "2026-09-02" → "Sept". Chart axes only — the one surface allowed a bare
 *  short month (design skill: axis cells are a sanctioned shortening). */
export function formatMonthShort(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return MONTH_SHORT.format(value)
}

/** "2027-03-31" → "March 2027" */
export function formatMonthYear(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${MONTH_LONG.format(value)} ${value.getFullYear()}`
}

/** "2026-08-02" → "Sunday 2nd August" */
export function formatWeekdayDate(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${WEEKDAY_LONG.format(value)} ${ordinal(value.getDate())} ${MONTH_LONG.format(value)}`
}

/** "2026-08-02" → "Sun 2nd Aug". Dense surfaces only. */
export function formatWeekdayDateShort(date: string | Date): string {
  const value = resolve(date)
  if (!value) return "—"
  return `${WEEKDAY_SHORT.format(value)} ${ordinal(value.getDate())} ${MONTH_SHORT.format(value)}`
}
