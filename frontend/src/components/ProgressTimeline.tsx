import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useContentTranslation } from "../contexts/ContentTranslationContext"
import type { ProgressStage } from "../types/entry"
import "./ProgressTimeline.css"

interface Props {
  stages: ProgressStage[]
  onToggleDone: (stageId: string, done: boolean) => void
  onUpdateStage: (stageId: string, patch: { label?: string; date?: string | null }) => void
  onDeleteStage: (stageId: string) => void
  onAddStage: (label: string, date: string | null) => void
}

export function ProgressTimeline({ stages, onToggleDone, onUpdateStage, onDeleteStage, onAddStage }: Props) {
  const { t, i18n } = useTranslation()
  const { translate, requestTexts } = useContentTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newDate, setNewDate] = useState("")

  useEffect(() => {
    requestTexts(stages.filter((s) => !s.isDefault).map((s) => s.label))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages, i18n.language])

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    onAddStage(newLabel.trim(), newDate || null)
    setNewLabel("")
    setNewDate("")
    setShowAddForm(false)
  }

  return (
    <div className="progress-timeline">
      {stages.map((stage, i) => {
        const isFirst = i === 0
        const isLast = i === stages.length - 1
        const isDone = isFirst || stage.done
        const displayLabel = stage.isDefault
          ? t(isFirst ? "progress.defaultStart" : "progress.defaultEnd")
          : translate(stage.label)
        return (
          <div key={stage.id} className="stage-row">
            {!isFirst && (
              <button
                className={isDone ? "stage-connector stage-connector-done" : "stage-connector"}
                title={t("progress.toggleTitle")}
                onClick={() => onToggleDone(stage.id, !stage.done)}
              />
            )}
            <div className="stage-main">
              <button
                className={isDone ? "stage-dot stage-dot-done" : "stage-dot"}
                disabled={isFirst}
                onClick={() => onToggleDone(stage.id, !stage.done)}
              >
                {isDone && "✓"}
              </button>
              <input
                key={`${stage.id}-${i18n.language}-${displayLabel}`}
                className="stage-label"
                defaultValue={displayLabel}
                onBlur={(e) => e.target.value !== displayLabel && onUpdateStage(stage.id, { label: e.target.value })}
              />
              <input
                type="date"
                className="stage-date"
                defaultValue={stage.date ?? ""}
                onChange={(e) => onUpdateStage(stage.id, { date: e.target.value || null })}
              />
              {!isFirst && !isLast && (
                <button className="stage-delete" onClick={() => onDeleteStage(stage.id)}>
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}

      {showAddForm ? (
        <form className="stage-add-form" onSubmit={handleAddSubmit}>
          <input
            placeholder={t("progress.stageNamePlaceholder")}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            autoFocus
          />
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <button type="submit">{t("progress.add")}</button>
          <button type="button" onClick={() => setShowAddForm(false)}>
            {t("progress.cancel")}
          </button>
        </form>
      ) : (
        <button className="stage-add-trigger" onClick={() => setShowAddForm(true)}>
          {t("progress.addTrigger")}
        </button>
      )}
    </div>
  )
}
