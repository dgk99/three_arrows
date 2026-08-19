import type { Entry } from "../types/entry"

const BASE_URL = import.meta.env.VITE_API_URL
const ORIGIN = BASE_URL.replace(/\/api\/?$/, "")

export function resolveAssetUrl(url: string): string {
  return `${ORIGIN}${url}`
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

async function upload<T>(path: string, file: File, fieldName: string): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: formData })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
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

  addPhoto: (entryId: string, file: File) => upload<Entry>(`/entries/${entryId}/photos`, file, "photo"),

  deletePhoto: (entryId: string, photoId: string) =>
    request<Entry>(`/entries/${entryId}/photos/${photoId}`, { method: "DELETE" }),

  addAttachment: (entryId: string, file: File) =>
    upload<Entry>(`/entries/${entryId}/attachments`, file, "file"),

  deleteAttachment: (entryId: string, attachmentId: string) =>
    request<Entry>(`/entries/${entryId}/attachments/${attachmentId}`, { method: "DELETE" }),
}
