import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import multer from "multer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.join(__dirname, "..", "uploads")

const PHOTOS_DIR = path.join(UPLOADS_DIR, "photos")
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, "attachments")

fs.mkdirSync(PHOTOS_DIR, { recursive: true })
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true })

function storageFor(dir: string) {
  return multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`)
    },
  })
}

export const photoUpload = multer({ storage: storageFor(PHOTOS_DIR) })
export const attachmentUpload = multer({ storage: storageFor(ATTACHMENTS_DIR) })

export function photoUrl(filename: string): string {
  return `/uploads/photos/${filename}`
}

export function attachmentUrl(filename: string): string {
  return `/uploads/attachments/${filename}`
}

export function deleteUploadedFile(url: string): void {
  const relative = url.replace(/^\/uploads\//, "")
  const filePath = path.join(UPLOADS_DIR, relative)
  if (!filePath.startsWith(UPLOADS_DIR)) return
  fs.rm(filePath, { force: true }, () => {})
}
