import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import "./FilePreviewUploader.css"

interface LocalFile {
  id: string
  url: string
  name: string
  size: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function FilePreviewUploader() {
  const { t } = useTranslation()
  const [files, setFiles] = useState<LocalFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    const added = Array.from(list).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }))
    setFiles((prev) => [...prev, ...added])
    e.target.value = ""
  }

  function remove(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((f) => f.id !== id)
    })
  }

  return (
    <div className="file-uploader">
      <ul className="file-list">
        {files.map((f) => (
          <li key={f.id} className="file-item">
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.name}
            </a>
            <span className="file-size">{formatSize(f.size)}</span>
            <button onClick={() => remove(f.id)}>{t("file.delete")}</button>
          </li>
        ))}
      </ul>
      <button className="file-add-trigger" onClick={() => inputRef.current?.click()}>
        {t("file.addTrigger")}
      </button>
      <input ref={inputRef} type="file" multiple hidden onChange={handleFiles} />
    </div>
  )
}
