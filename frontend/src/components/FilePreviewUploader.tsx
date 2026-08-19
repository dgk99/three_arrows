import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi, resolveAssetUrl } from "../api/entries"
import type { Attachment } from "../types/entry"
import "./FilePreviewUploader.css"

interface Props {
  entryId: string
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
}

export function FilePreviewUploader({ entryId, attachments, onChange }: Props) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const updated = await entriesApi.addAttachment(entryId, file)
        onChange(updated.attachments)
      }
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function remove(attachmentId: string) {
    const updated = await entriesApi.deleteAttachment(entryId, attachmentId)
    onChange(updated.attachments)
  }

  return (
    <div className="file-uploader">
      <ul className="file-list">
        {attachments.map((a) => (
          <li key={a.id} className="file-item">
            <a href={resolveAssetUrl(a.url)} target="_blank" rel="noreferrer">
              {a.fileName}
            </a>
            <button onClick={() => remove(a.id)}>{t("file.delete")}</button>
          </li>
        ))}
      </ul>
      <button className="file-add-trigger" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? "…" : t("file.addTrigger")}
      </button>
      <input ref={inputRef} type="file" multiple hidden onChange={handleFiles} />
    </div>
  )
}
