import type { Entry } from "../types/entry"

const BASE_URL = import.meta.env.VITE_API_URL

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const entriesApi = {
  getAllEntries: () => request<Entry[]>(`/entries`),
  getEntriesByDate: (date: string) => request<Entry[]>(`/entries?date=${date}`),
  getPlanEntries: () => request<Entry[]>(`/entries?plan=true`),
  getEntryById: (id: string) => request<Entry>(`/entries/${id}`),

  createEntry: (params: { title: string; scheduledDate: string | null }) =>
    request<Entry>(`/entries`, { method: "POST", body: JSON.stringify(params) }),

  updateEntry: (id: string, patch: Partial<Entry>) =>
    request<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteEntry: (id: string) => request<void>(`/entries/${id}`, { method: "DELETE" }),

  addMemoLine: (entryId: string, text: string) =>
    request<Entry>(`/entries/${entryId}/memos`, { method: "POST", body: JSON.stringify({ text }) }),

  updateMemoLine: (entryId: string, lineId: string, text: string) =>
    request<Entry>(`/entries/${entryId}/memos/${lineId}`, {
      method: "PATCH",
      body: JSON.stringify({ text }),
    }),

  deleteMemoLine: (entryId: string, lineId: string) =>
    request<Entry>(`/entries/${entryId}/memos/${lineId}`, { method: "DELETE" }),

  addStage: (entryId: string, params: { label: string; date: string | null }) =>
    request<Entry>(`/entries/${entryId}/stages`, { method: "POST", body: JSON.stringify(params) }),

  updateStage: (
    entryId: string,
    stageId: string,
    patch: { label?: string; date?: string | null; done?: boolean }
  ) =>
    request<Entry>(`/entries/${entryId}/stages/${stageId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteStage: (entryId: string, stageId: string) =>
    request<Entry>(`/entries/${entryId}/stages/${stageId}`, { method: "DELETE" }),
}
