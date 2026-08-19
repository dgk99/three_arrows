import { Router } from "express"
import { Pool } from "pg"
import { translateTexts } from "../ai/translateTexts.js"

export function createTranslateRouter(pool: Pool): Router {
  const router = Router()

  router.post("/", async (req, res) => {
    const { texts, targetLanguage } = req.body
    if (!Array.isArray(texts) || typeof targetLanguage !== "string") {
      return res.status(400).json({ error: "texts (string[]) and targetLanguage (string) are required" })
    }
    try {
      const translations = await translateTexts(pool, texts, targetLanguage)
      res.json({ translations })
    } catch (err) {
      console.error("Translation failed:", err)
      res.status(502).json({ error: "Failed to translate" })
    }
  })

  return router
}
