import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { entriesApi, resolveAssetUrl } from "../api/entries"
import type { Photo } from "../types/entry"
import "./PhotoPreviewUploader.css"

interface Props {
  entryId: string
  photos: Photo[]
  onChange: (photos: Photo[]) => void
}

export function PhotoPreviewUploader({ entryId, photos, onChange }: Props) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const updated = await entriesApi.addPhoto(entryId, file)
        onChange(updated.photos)
      }
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function remove(photoId: string) {
    const updated = await entriesApi.deletePhoto(entryId, photoId)
    onChange(updated.photos)
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="photo-thumb">
            <img src={resolveAssetUrl(p.url)} alt="" />
            <button onClick={() => remove(p.id)} aria-label={t("photo.delete")}>
              ×
            </button>
          </div>
        ))}
        <button className="photo-add" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "…" : "+"}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
    </div>
  )
}
