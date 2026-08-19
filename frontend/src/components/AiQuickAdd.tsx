import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { aiApi } from "../api/ai"
import type { Entry } from "../types/entry"
import { toDateKey } from "../utils/date"
import "./AiQuickAdd.css"

const TOAST_DURATION_MS = 1000

interface Props {
  onCreated: (entries: Entry[]) => void
}

export function AiQuickAdd({ onCreated }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => clearTimeout(toastTimeout.current)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    setLoading(true)
    setError(false)
    try {
      const entries = await aiApi.runAssistant(trimmed, toDateKey(new Date()))
      onCreated(entries)
      setText("")
      setShowToast(true)
      clearTimeout(toastTimeout.current)
      toastTimeout.current = setTimeout(() => setShowToast(false), TOAST_DURATION_MS)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="ai-quick-add" onSubmit={handleSubmit}>
      <span className="ai-quick-add-label">{t("aiQuickAdd.label")}</span>
      <div className="ai-quick-add-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("aiQuickAdd.placeholder")}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? t("aiQuickAdd.loading") : t("aiQuickAdd.submit")}
        </button>
      </div>
      {error && <p className="ai-quick-add-error">{t("aiQuickAdd.error")}</p>}
      {showToast && <div className="ai-quick-add-toast">{t("aiQuickAdd.success")}</div>}
    </form>
  )
}
