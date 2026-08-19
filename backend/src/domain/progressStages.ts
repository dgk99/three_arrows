import { ProgressStage } from "../types/entry.js"

// The first (start) and last (end) stages of an entry can be renamed/rescheduled
// but never deleted — enforced here so the REST API and the AI tool agree.
export function isProtectedStage(stages: ProgressStage[], stageId: string): boolean {
  const index = stages.findIndex((s) => s.id === stageId)
  if (index === -1) return false
  return index === 0 || index === stages.length - 1
}
