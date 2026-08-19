import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useContentTranslation } from "../contexts/ContentTranslationContext"
import type { Entry } from "../types/entry"
import { progressPercent } from "../utils/progress"
import "./EntryListPanel.css"

interface Props {
  title: string
  entries: Entry[]
  selectedId?: string | null
  onAdd: (title: string) => void
  onSelect: (id: string) => void
}

export function EntryListPanel({ title, entries, selectedId, onAdd, onSelect }: Props) {
  const { t, i18n } = useTranslation()
  const { translate, requestTexts } = useContentTranslation()
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    requestTexts(entries.map((e) => e.title))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, i18n.language])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewTitle("")
  }

  return (
    <div className="entry-list-panel">
      <h2>{title}</h2>
      <form className="entry-add-form" onSubmit={handleSubmit}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("entryList.addPlaceholder")}
        />
        <button type="submit">{t("entryList.add")}</button>
      </form>
      <ul className="entry-list">
        {entries.length === 0 && <li className="entry-list-empty">{t("entryList.empty")}</li>}
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={
              entry.id === selectedId ? "entry-list-item entry-list-item-selected" : "entry-list-item"
            }
            onClick={() => onSelect(entry.id)}
          >
            <span className="entry-list-title">{translate(entry.title)}</span>
            <span className="entry-list-progress">{progressPercent(entry)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
