import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi } from "../api/entries"
import { AiQuickAdd } from "../components/AiQuickAdd"
import { EntryDetailPanel } from "../components/EntryDetailPanel"
import { EntryListPanel } from "../components/EntryListPanel"
import type { Entry } from "../types/entry"
import "./PlanPage.css"

export function PlanPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  async function reload() {
    setEntries(await entriesApi.getPlanEntries())
    setRefreshTick((tick) => tick + 1)
  }

  useEffect(() => {
    reload()
  }, [])

  async function handleAdd(title: string) {
    await entriesApi.createEntry({ title, scheduledDate: null })
    reload()
  }

  return (
    <div className="plan-page">
      <AiQuickAdd onCreated={reload} />
      <div className="plan-page-grid">
        <EntryListPanel
          title={t("nav.plan")}
          entries={entries}
          selectedId={selectedEntryId}
          onAdd={handleAdd}
          onSelect={setSelectedEntryId}
        />
        <div className="plan-detail-slot">
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
