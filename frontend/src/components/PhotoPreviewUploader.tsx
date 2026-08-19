import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import "./PhotoPreviewUploader.css"

interface LocalPhoto {
  id: string
  url: string
}

export function PhotoPreviewUploader() {
  const { t } = useTranslation()
  const [photos, setPhotos] = useState<LocalPhoto[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const added = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...added])
    e.target.value = ""
  }

  function remove(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="photo-thumb">
            <img src={p.url} alt="" />
            <button onClick={() => remove(p.id)} aria-label={t("photo.delete")}>
              ×
            </button>
          </div>
        ))}
        <button className="photo-add" onClick={() => inputRef.current?.click()}>
          +
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
    </div>
  )
}
