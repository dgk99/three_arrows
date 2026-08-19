export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

// Grid of 6 weeks (42 days) starting from the Sunday on/before the 1st of the month.
export function getMonthGrid(monthStart: Date): Date[] {
  const firstWeekday = monthStart.getDay()
  const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - firstWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

const INTL_LOCALES: Record<string, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" }

export function toIntlLocale(language: string): string {
  return INTL_LOCALES[language] ?? "en-US"
}

export function formatMonthHeader(date: Date, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), { year: "numeric", month: "long" }).format(date)
}

export function getWeekdayLabels(language: string): string[] {
  const locale = toIntlLocale(language)
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" })
  // 2024-01-07 was a Sunday; use it as an anchor to build Sun..Sat labels.
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 7 + i)))
}
