import { Entry } from "../types/entry.js"

export interface EntryRepository {
  getAllEntries(): Promise<Entry[]>
  getEntriesByDate(date: string): Promise<Entry[]>
  getPlanEntries(): Promise<Entry[]>
  getEntryById(id: string): Promise<Entry | undefined>
  createEntry(params: { title: string; scheduledDate: string | null }): Promise<Entry>
  updateEntry(id: string, patch: Partial<Entry>): Promise<Entry | undefined>
  deleteEntry(id: string): Promise<void>

  addMemoLine(entryId: string, text: string): Promise<Entry | undefined>
  updateMemoLine(entryId: string, lineId: string, text: string): Promise<Entry | undefined>
  deleteMemoLine(entryId: string, lineId: string): Promise<Entry | undefined>

  addStage(entryId: string, params: { label: string; date: string | null }): Promise<Entry | undefined>
  updateStage(
    entryId: string,
    stageId: string,
    patch: { label?: string; date?: string | null; done?: boolean }
  ): Promise<Entry | undefined>
  deleteStage(entryId: string, stageId: string): Promise<Entry | undefined>
}
