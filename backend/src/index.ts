import express from "express"
import cors from "cors"
import "dotenv/config"
import { pool } from "./db/pool.js"
import { PgEntryRepository } from "./repository/PgEntryRepository.js"
import { createAiRouter } from "./routes/ai.js"
import { createEntriesRouter } from "./routes/entries.js"
import { createTranslateRouter } from "./routes/translate.js"
import { UPLOADS_DIR } from "./storage.js"

const app = express()
const port = process.env.PORT ?? 4000

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(UPLOADS_DIR))

const repo = new PgEntryRepository(pool)
app.use("/api/entries", createEntriesRouter(repo))
app.use("/api/ai", createAiRouter(repo))
app.use("/api/translate", createTranslateRouter(pool))

app.get("/health", (_req, res) => res.json({ status: "ok" }))

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
