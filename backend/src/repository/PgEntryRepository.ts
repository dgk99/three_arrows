import { Pool, PoolClient } from "pg"
import { Entry } from "../types/entry.js"
import { EntryRepository } from "./EntryRepository.js"

const SELECT_ENTRY_BASE = `
  SELECT
    e.id,
    e.title,
    e.scheduled_date AS "scheduledDate",
    e.created_at AS "createdAt",
    e.updated_at AS "updatedAt",
    COALESCE(s.stages, '[]'::jsonb) AS stages,
    COALESCE(m.memos, '[]'::jsonb) AS memos,
    COALESCE(p.photos, '[]'::jsonb) AS photos,
    COALESCE(a.attachments, '[]'::jsonb) AS attachments
  FROM entries e
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', id, 'label', label, 'date', date, 'order', "order", 'done', done, 'isDefault', is_default) ORDER BY "order") AS stages
    FROM progress_stages WHERE entry_id = e.id
  ) s ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', id, 'text', text, 'order', "order") ORDER BY "order") AS memos
    FROM memo_lines WHERE entry_id = e.id
  ) m ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', id, 'url', url, 'uploadedAt', uploaded_at) ORDER BY uploaded_at) AS photos
    FROM photos WHERE entry_id = e.id
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', id, 'fileName', file_name, 'url', url, 'fileType', file_type, 'uploadedAt', uploaded_at) ORDER BY uploaded_at) AS attachments
    FROM attachments WHERE entry_id = e.id
  ) a ON true
`

function toEntry(row: any): Entry {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class PgEntryRepository implements EntryRepository {
  constructor(private pool: Pool) {}

  async getAllEntries(): Promise<Entry[]> {
    const { rows } = await this.pool.query(`${SELECT_ENTRY_BASE} ORDER BY e.created_at DESC`)
    return rows.map(toEntry)
  }

  async getEntriesByDate(date: string): Promise<Entry[]> {
    const { rows } = await this.pool.query(
      `${SELECT_ENTRY_BASE} WHERE e.scheduled_date = $1 ORDER BY e.created_at DESC`,
      [date]
    )
    return rows.map(toEntry)
  }

  async getPlanEntries(): Promise<Entry[]> {
    const { rows } = await this.pool.query(
      `${SELECT_ENTRY_BASE} WHERE e.scheduled_date IS NULL ORDER BY e.created_at DESC`
    )
    return rows.map(toEntry)
  }

  async getEntryById(id: string): Promise<Entry | undefined> {
    const { rows } = await this.pool.query(`${SELECT_ENTRY_BASE} WHERE e.id = $1`, [id])
    return rows[0] ? toEntry(rows[0]) : undefined
  }

  async createEntry(params: { title: string; scheduledDate: string | null }): Promise<Entry> {
    const { rows } = await this.pool.query(
      `INSERT INTO entries (title, scheduled_date) VALUES ($1, $2) RETURNING id`,
      [params.title, params.scheduledDate]
    )
    const entryId = rows[0].id
    await this.pool.query(
      `INSERT INTO progress_stages (entry_id, label, "order", done, is_default)
       VALUES ($1, '시작', 0, true, true), ($1, '완료', 1, false, true)`,
      [entryId]
    )
    return (await this.getEntryById(entryId)) as Entry
  }

  async updateEntry(id: string, patch: Partial<Entry>): Promise<Entry | undefined> {
    const fields: string[] = []
    const values: unknown[] = []
    if (patch.title !== undefined) {
      values.push(patch.title)
      fields.push(`title = $${values.length}`)
    }
    if (patch.scheduledDate !== undefined) {
      values.push(patch.scheduledDate)
      fields.push(`scheduled_date = $${values.length}`)
    }
    if (fields.length === 0) return this.getEntryById(id)

    values.push(id)
    const { rowCount } = await this.pool.query(
      `UPDATE entries SET ${fields.join(", ")}, updated_at = now() WHERE id = $${values.length}`,
      values
    )
    if (rowCount === 0) return undefined
    return this.getEntryById(id)
  }

  async deleteEntry(id: string): Promise<void> {
    await this.pool.query(`DELETE FROM entries WHERE id = $1`, [id])
  }

  // Callers (notably the AI assistant) may issue several add_* calls for the same
  // entry concurrently. A plain read-then-write race would let them compute the
  // same "next order" value. Serialize per-entry with a transaction-scoped
  // advisory lock keyed on the entry id.
  private async withEntryLock<T>(entryId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query("BEGIN")
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [entryId])
      const result = await fn(client)
      await client.query("COMMIT")
      return result
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  }

  async addMemoLine(entryId: string, text: string): Promise<Entry | undefined> {
    const inserted = await this.withEntryLock(entryId, async (client) => {
      const { rowCount } = await client.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
      if (rowCount === 0) return false
      const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM memo_lines WHERE entry_id = $1`, [
        entryId,
      ])
      await client.query(`INSERT INTO memo_lines (entry_id, text, "order") VALUES ($1, $2, $3)`, [
        entryId,
        text,
        rows[0].count,
      ])
      return true
    })
    if (!inserted) return undefined
    return this.getEntryById(entryId)
  }

  async updateMemoLine(entryId: string, lineId: string, text: string): Promise<Entry | undefined> {
    const { rowCount } = await this.pool.query(
      `UPDATE memo_lines SET text = $1 WHERE id = $2 AND entry_id = $3`,
      [text, lineId, entryId]
    )
    if (rowCount === 0) return undefined
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async deleteMemoLine(entryId: string, lineId: string): Promise<Entry | undefined> {
    const entry = await this.getEntryById(entryId)
    if (!entry) return undefined
    await this.pool.query(`DELETE FROM memo_lines WHERE id = $1 AND entry_id = $2`, [lineId, entryId])
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async addStage(entryId: string, params: { label: string; date: string | null }): Promise<Entry | undefined> {
    const inserted = await this.withEntryLock(entryId, async (client) => {
      const { rows } = await client.query(
        `SELECT id, "order" FROM progress_stages WHERE entry_id = $1 ORDER BY "order" DESC LIMIT 1`,
        [entryId]
      )
      if (rows.length === 0) return false
      const endStage = rows[0]
      await client.query(`UPDATE progress_stages SET "order" = "order" + 1 WHERE id = $1`, [endStage.id])
      await client.query(
        `INSERT INTO progress_stages (entry_id, label, date, "order", done) VALUES ($1, $2, $3, $4, false)`,
        [entryId, params.label, params.date, endStage.order]
      )
      await client.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
      return true
    })
    if (!inserted) return undefined
    return this.getEntryById(entryId)
  }

  async updateStage(
    entryId: string,
    stageId: string,
    patch: { label?: string; date?: string | null; done?: boolean }
  ): Promise<Entry | undefined> {
    const fields: string[] = []
    const values: unknown[] = []
    if (patch.label !== undefined) {
      values.push(patch.label)
      fields.push(`label = $${values.length}`)
      fields.push(`is_default = false`)
    }
    if (patch.date !== undefined) {
      values.push(patch.date)
      fields.push(`date = $${values.length}`)
    }
    if (patch.done !== undefined) {
      values.push(patch.done)
      fields.push(`done = $${values.length}`)
    }
    if (fields.length === 0) return this.getEntryById(entryId)

    values.push(stageId, entryId)
    const { rowCount } = await this.pool.query(
      `UPDATE progress_stages SET ${fields.join(", ")} WHERE id = $${values.length - 1} AND entry_id = $${values.length}`,
      values
    )
    if (rowCount === 0) return undefined
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async deleteStage(entryId: string, stageId: string): Promise<Entry | undefined> {
    await this.pool.query(`DELETE FROM progress_stages WHERE id = $1 AND entry_id = $2`, [stageId, entryId])
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async addPhoto(entryId: string, params: { url: string }): Promise<Entry | undefined> {
    const entry = await this.getEntryById(entryId)
    if (!entry) return undefined
    await this.pool.query(`INSERT INTO photos (entry_id, url) VALUES ($1, $2)`, [entryId, params.url])
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async deletePhoto(entryId: string, photoId: string): Promise<Entry | undefined> {
    await this.pool.query(`DELETE FROM photos WHERE id = $1 AND entry_id = $2`, [photoId, entryId])
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async addAttachment(
    entryId: string,
    params: { fileName: string; url: string; fileType: string }
  ): Promise<Entry | undefined> {
    const entry = await this.getEntryById(entryId)
    if (!entry) return undefined
    await this.pool.query(
      `INSERT INTO attachments (entry_id, file_name, url, file_type) VALUES ($1, $2, $3, $4)`,
      [entryId, params.fileName, params.url, params.fileType]
    )
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }

  async deleteAttachment(entryId: string, attachmentId: string): Promise<Entry | undefined> {
    await this.pool.query(`DELETE FROM attachments WHERE id = $1 AND entry_id = $2`, [attachmentId, entryId])
    await this.pool.query(`UPDATE entries SET updated_at = now() WHERE id = $1`, [entryId])
    return this.getEntryById(entryId)
  }
}
