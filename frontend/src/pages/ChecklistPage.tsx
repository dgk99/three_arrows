import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi } from "../api/entries"
import { EntryDetailPanel } from "../components/EntryDetailPanel"
import { EntryListPanel } from "../components/EntryListPanel"
import { MonthCalendar } from "../components/MonthCalendar"
import type { Entry } from "../types/entry"
import { startOfMonth, toDateKey } from "../utils/date"
import "./ChecklistPage.css"

export function ChecklistPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  async function reload() {
    setEntries(await entriesApi.getAllEntries())
  }

  useEffect(() => {
    reload()
  }, [])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of entries) {
      if (!entry.scheduledDate) continue
      const list = map.get(entry.scheduledDate) ?? []
      list.push(entry)
      map.set(entry.scheduledDate, list)
    }
    return map
  }, [entries])

  const selectedEntries = entriesByDate.get(selectedDate) ?? []

  async function handleAdd(title: string) {
    await entriesApi.createEntry({ title, scheduledDate: selectedDate })
    reload()
  }

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedEntryId(null)
  }

  return (
    <div className="checklist-page">
      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        entriesByDate={entriesByDate}
        onSelectDate={handleSelectDate}
        onChangeMonth={setMonth}
      />
      <div className="checklist-bottom">
        <EntryListPanel
          title={t("entryList.checklistTitle", { date: selectedDate })}
          entries={selectedEntries}
          selectedId={selectedEntryId}
          onAdd={handleAdd}
          onSelect={setSelectedEntryId}
        />
        <div className="checklist-detail-slot">
          {selectedEntryId && (
            <EntryDetailPanel
              entryId={selectedEntryId}
              onClose={() => setSelectedEntryId(null)}
              onChanged={reload}
            />
          )}
        </div>
      </div>
    </div>
  )
}
