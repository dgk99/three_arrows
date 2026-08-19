import type { Entry } from "../types/entry"

export function progressPercent(entry: Pick<Entry, "stages">): number {
  const segments = entry.stages.length - 1
  if (segments <= 0) return 0
  const done = entry.stages.slice(1).filter((s) => s.done).length
  return Math.round((done / segments) * 100)
}
