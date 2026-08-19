import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi } from "../api/entries"
import { useContentTranslation } from "../contexts/ContentTranslationContext"
import type { Entry } from "../types/entry"
import { FilePreviewUploader } from "./FilePreviewUploader"
import { PhotoPreviewUploader } from "./PhotoPreviewUploader"
import { ProgressTimeline } from "./ProgressTimeline"
import "./EntryDetailPanel.css"

interface Props {
  entryId: string
  refreshSignal?: number
  onClose: () => void
  onChanged: () => void
}

export function EntryDetailPanel({ entryId, refreshSignal, onClose, onChanged }: Props) {
  const { t, i18n } = useTranslation()
  const { translate, requestTexts } = useContentTranslation()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [newMemo, setNewMemo] = useState("")

  useEffect(() => {
    let cancelled = false
    entriesApi.getEntryById(entryId).then((data) => {
      if (cancelled) return
      setEntry(data)
    })
    return () => {
      cancelled = true
    }
    // refreshSignal is bumped by the parent whenever entries may have changed
    // elsewhere (e.g. the AI assistant), so this panel stays in sync without
    // requiring the user to reselect the entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, refreshSignal])

  useEffect(() => {
    if (!entry) return
    requestTexts([
      entry.title,
      ...entry.stages.filter((s) => !s.isDefault).map((s) => s.label),
      ...entry.memos.map((m) => m.text),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, i18n.language])

  async function saveTitle(newTitle: string) {
    if (!entry) return
    const updated = await entriesApi.updateEntry(entry.id, { title: newTitle })
    setEntry(updated)
    onChanged()
  }

  async function handleAddMemo(e: FormEvent) {
    e.preventDefault()
    if (!entry || !newMemo.trim()) return
    const updated = await entriesApi.addMemoLine(entry.id, newMemo.trim())
    setEntry(updated)
    setNewMemo("")
  }

  async function handleUpdateMemo(lineId: string, text: string) {
    if (!entry) return
    const updated = await entriesApi.updateMemoLine(entry.id, lineId, text)
    setEntry(updated)
  }

  async function handleDeleteMemo(lineId: string) {
    if (!entry) return
    const updated = await entriesApi.deleteMemoLine(entry.id, lineId)
    setEntry(updated)
  }

  async function handleToggleStageDone(stageId: string, done: boolean) {
    if (!entry) return
    const updated = await entriesApi.updateStage(entry.id, stageId, { done })
    setEntry(updated)
    onChanged()
  }

  async function handleUpdateStage(stageId: string, patch: { label?: string; date?: string | null }) {
    if (!entry) return
    const updated = await entriesApi.updateStage(entry.id, stageId, patch)
    setEntry(updated)
  }

  async function handleDeleteStage(stageId: string) {
    if (!entry) return
    const updated = await entriesApi.deleteStage(entry.id, stageId)
    setEntry(updated)
  }

  async function handleAddStage(label: string, date: string | null) {
    if (!entry) return
    const updated = await entriesApi.addStage(entry.id, { label, date })
    setEntry(updated)
  }

  async function handleDeleteEntry() {
    if (!entry) return
    if (!confirm(t("entryDetail.confirmDeleteEntry"))) return
    await entriesApi.deleteEntry(entry.id)
    onChanged()
    onClose()
  }

  return (
    <div className="entry-detail-panel">
      <button className="entry-detail-close" onClick={onClose} aria-label={t("entryDetail.close")}>
        ×
      </button>

      {!entry ? (
        <p>{t("entryDetail.loading")}</p>
      ) : (
        <>
          {(() => {
            const displayTitle = translate(entry.title)
            return (
              <input
                key={`title-${entry.id}-${i18n.language}-${displayTitle}`}
                className="entry-detail-title"
                defaultValue={displayTitle}
                onBlur={(e) => e.target.value !== displayTitle && saveTitle(e.target.value)}
              />
            )
          })()}

          <section className="entry-detail-section">
            <h3>{t("entryDetail.stagesHeading")}</h3>
            <ProgressTimeline
              stages={entry.stages}
              onToggleDone={handleToggleStageDone}
              onUpdateStage={handleUpdateStage}
              onDeleteStage={handleDeleteStage}
              onAddStage={handleAddStage}
            />
          </section>

          <section className="entry-detail-section">
            <h3>{t("entryDetail.memosHeading")}</h3>
            <form className="memo-add-form" onSubmit={handleAddMemo}>
              <input
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder={t("entryDetail.memoPlaceholder")}
              />
              <button type="submit">{t("entryDetail.add")}</button>
            </form>
            <ul className="memo-list">
              {entry.memos.map((memo) => {
                const displayText = translate(memo.text)
                return (
                  <li key={memo.id} className="memo-item">
                    <input
                      key={`${memo.id}-${i18n.language}-${displayText}`}
                      defaultValue={displayText}
                      onBlur={(e) => e.target.value !== displayText && handleUpdateMemo(memo.id, e.target.value)}
                    />
                    <button className="memo-delete" onClick={() => handleDeleteMemo(memo.id)}>
                      {t("entryDetail.delete")}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="entry-detail-section">
            <h3>{t("entryDetail.photosHeading")}</h3>
            <PhotoPreviewUploader />
            <p className="entry-detail-note">{t("entryDetail.previewNote")}</p>
          </section>

          <section className="entry-detail-section">
            <h3>{t("entryDetail.attachmentsHeading")}</h3>
            <FilePreviewUploader />
            <p className="entry-detail-note">{t("entryDetail.previewNote")}</p>
          </section>

          <button className="entry-detail-delete" onClick={handleDeleteEntry}>
            {t("entryDetail.deleteEntry")}
          </button>
        </>
      )}
    </div>
  )
}
