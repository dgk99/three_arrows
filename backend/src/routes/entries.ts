import { Router } from "express"
import { EntryRepository } from "../repository/EntryRepository.js"
import { attachmentUpload, attachmentUrl, deleteUploadedFile, photoUpload, photoUrl } from "../storage.js"

export function createEntriesRouter(repo: EntryRepository): Router {
  const router = Router()

  router.get("/", async (req, res) => {
    const { date, plan } = req.query
    if (date) return res.json(await repo.getEntriesByDate(String(date)))
    if (plan) return res.json(await repo.getPlanEntries())
    res.json(await repo.getAllEntries())
  })

  router.get("/:id", async (req, res) => {
    const entry = await repo.getEntryById(req.params.id)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.json(entry)
  })

  router.post("/", async (req, res) => {
    const { title, scheduledDate } = req.body
    res.status(201).json(await repo.createEntry({ title, scheduledDate: scheduledDate ?? null }))
  })

  router.patch("/:id", async (req, res) => {
    const entry = await repo.updateEntry(req.params.id, req.body)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.json(entry)
  })

  router.delete("/:id", async (req, res) => {
    await repo.deleteEntry(req.params.id)
    res.status(204).send()
  })

  router.post("/:id/memos", async (req, res) => {
    const entry = await repo.addMemoLine(req.params.id, req.body.text)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.status(201).json(entry)
  })

  router.patch("/:id/memos/:lineId", async (req, res) => {
    const entry = await repo.updateMemoLine(req.params.id, req.params.lineId, req.body.text)
    if (!entry) return res.status(404).json({ error: "Entry or memo not found" })
    res.json(entry)
  })

  router.delete("/:id/memos/:lineId", async (req, res) => {
    const entry = await repo.deleteMemoLine(req.params.id, req.params.lineId)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.json(entry)
  })

  router.post("/:id/stages", async (req, res) => {
    const { label, date } = req.body
    const entry = await repo.addStage(req.params.id, { label, date: date ?? null })
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.status(201).json(entry)
  })

  router.patch("/:id/stages/:stageId", async (req, res) => {
    const entry = await repo.updateStage(req.params.id, req.params.stageId, req.body)
    if (!entry) return res.status(404).json({ error: "Entry or stage not found" })
    res.json(entry)
  })

  router.delete("/:id/stages/:stageId", async (req, res) => {
    const entry = await repo.getEntryById(req.params.id)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    const index = entry.stages.findIndex((s) => s.id === req.params.stageId)
    if (index === -1) return res.status(404).json({ error: "Stage not found" })
    if (index === 0 || index === entry.stages.length - 1) {
      return res.status(400).json({ error: "시작/완료 단계는 삭제할 수 없습니다" })
    }
    res.json(await repo.deleteStage(req.params.id, req.params.stageId))
  })

  router.post<{ id: string }>("/:id/photos", photoUpload.single("photo"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No photo uploaded" })
    const entry = await repo.addPhoto(req.params.id, { url: photoUrl(req.file.filename) })
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.status(201).json(entry)
  })

  router.delete("/:id/photos/:photoId", async (req, res) => {
    const entry = await repo.getEntryById(req.params.id)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    const photo = entry.photos.find((p) => p.id === req.params.photoId)
    if (!photo) return res.status(404).json({ error: "Photo not found" })
    const updated = await repo.deletePhoto(req.params.id, req.params.photoId)
    deleteUploadedFile(photo.url)
    res.json(updated)
  })

  router.post<{ id: string }>("/:id/attachments", attachmentUpload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" })
    const entry = await repo.addAttachment(req.params.id, {
      fileName: req.file.originalname,
      url: attachmentUrl(req.file.filename),
      fileType: req.file.mimetype,
    })
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    res.status(201).json(entry)
  })

  router.delete("/:id/attachments/:attachmentId", async (req, res) => {
    const entry = await repo.getEntryById(req.params.id)
    if (!entry) return res.status(404).json({ error: "Entry not found" })
    const attachment = entry.attachments.find((a) => a.id === req.params.attachmentId)
    if (!attachment) return res.status(404).json({ error: "Attachment not found" })
    const updated = await repo.deleteAttachment(req.params.id, req.params.attachmentId)
    deleteUploadedFile(attachment.url)
    res.json(updated)
  })

  return router
}
