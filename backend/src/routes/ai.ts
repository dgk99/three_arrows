import { Router } from "express"
import { runScheduleAssistant } from "../ai/runScheduleAssistant.js"
import { EntryRepository } from "../repository/EntryRepository.js"

export function createAiRouter(repo: EntryRepository): Router {
  const router = Router()

  router.post("/assistant", async (req, res) => {
    const { text, referenceDate } = req.body
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" })
    }
    const today = typeof referenceDate === "string" ? referenceDate : new Date().toISOString().slice(0, 10)
    try {
      const entries = await runScheduleAssistant(repo, text, today)
      res.status(200).json(entries)
    } catch (err) {
      console.error("AI schedule assistant failed:", err)
      res.status(502).json({ error: "Failed to process request with AI" })
    }
  })

  return router
}
