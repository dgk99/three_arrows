import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi } from "../api/entries"
import { EntryDetailPanel } from "../components/EntryDetailPanel"
import { EntryListPanel } from "../components/EntryListPanel"
import type { Entry } from "../types/entry"
import "./PlanPage.css"

export function PlanPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  async function reload() {
    setEntries(await entriesApi.getPlanEntries())
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
            onClose={() => setSelectedEntryId(null)}
            onChanged={reload}
          />
        )}
      </div>
    </div>
  )
}
