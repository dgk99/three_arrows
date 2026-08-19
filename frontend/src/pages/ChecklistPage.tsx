import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi } from "../api/entries"
import { AiQuickAdd } from "../components/AiQuickAdd"
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
  const [refreshTick, setRefreshTick] = useState(0)

  async function reload() {
    setEntries(await entriesApi.getAllEntries())
    setRefreshTick((tick) => tick + 1)
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

  function handleAiCreated(entries: Entry[]) {
    reload()
    const dated = entries.find((e) => e.scheduledDate)
    if (dated?.scheduledDate) {
      const [year, monthIndex] = dated.scheduledDate.split("-").map(Number)
      setMonth(new Date(year, monthIndex - 1, 1))
      setSelectedDate(dated.scheduledDate)
    }
  }

  return (
    <div className="checklist-page">
      <AiQuickAdd onCreated={handleAiCreated} />
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
              refreshSignal={refreshTick}
              onClose={() => setSelectedEntryId(null)}
              onChanged={reload}
            />
          )}
        </div>
      </div>
    </div>
  )
}
