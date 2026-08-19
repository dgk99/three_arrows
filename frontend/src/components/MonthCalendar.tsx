import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useContentTranslation } from "../contexts/ContentTranslationContext"
import type { Entry } from "../types/entry"
import { addMonths, formatMonthHeader, getMonthGrid, getWeekdayLabels, toDateKey } from "../utils/date"
import "./MonthCalendar.css"

const MAX_TAGS = 2

interface Props {
  month: Date
  selectedDate: string
  entriesByDate: Map<string, Entry[]>
  onSelectDate: (dateKey: string) => void
  onChangeMonth: (month: Date) => void
}

export function MonthCalendar({ month, selectedDate, entriesByDate, onSelectDate, onChangeMonth }: Props) {
  const { i18n } = useTranslation()
  const { translate, requestTexts } = useContentTranslation()
  const days = getMonthGrid(month)
  const todayKey = toDateKey(new Date())
  const weekdays = getWeekdayLabels(i18n.language)

  useEffect(() => {
    requestTexts([...entriesByDate.values()].flat().map((e) => e.title))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesByDate, i18n.language])

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button onClick={() => onChangeMonth(addMonths(month, -1))}>{"<"}</button>
        <span>{formatMonthHeader(month, i18n.language)}</span>
        <button onClick={() => onChangeMonth(addMonths(month, 1))}>{">"}</button>
      </div>
      <div className="calendar-grid calendar-weekdays">
        {weekdays.map((w, i) => (
          <div key={i} className="calendar-weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === month.getMonth()
          const entries = entriesByDate.get(key) ?? []
          return (
            <button
              key={key}
              className={[
                "calendar-cell",
                !inMonth && "calendar-cell-outside",
                key === selectedDate && "calendar-cell-selected",
                key === todayKey && "calendar-cell-today",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDate(key)}
            >
              <span className="calendar-date">{day.getDate()}</span>
              <span className="calendar-tags">
                {entries.slice(0, MAX_TAGS).map((e) => (
                  <span key={e.id} className="calendar-tag">
                    {translate(e.title)}
                  </span>
                ))}
                {entries.length > MAX_TAGS && (
                  <span className="calendar-tag-more">+{entries.length - MAX_TAGS}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
