import Anthropic from "@anthropic-ai/sdk"
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"
import { isProtectedStage } from "../domain/progressStages.js"
import { EntryRepository } from "../repository/EntryRepository.js"
import { Entry } from "../types/entry.js"

const client = new Anthropic()

function summarizeEntries(entries: Entry[]) {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    scheduledDate: e.scheduledDate,
    stages: e.stages.map((s) => ({ id: s.id, label: s.label, date: s.date, done: s.done })),
    memos: e.memos.map((m) => ({ id: m.id, text: m.text })),
  }))
}

export async function runScheduleAssistant(repo: EntryRepository, text: string, referenceDate: string): Promise<Entry[]> {
  const existing = await repo.getAllEntries()
  const affected = new Set<string>()

  const createEntry = betaZodTool({
    name: "create_entry",
    description:
      "Create a brand-new to-do entry for something that is NOT already in the Existing entries list below. " +
      "Call once per distinct new task/event, in the order mentioned. If the user is referring to something " +
      "already in Existing entries, do not create a duplicate — use update_entry / add_stage / add_memo on it.",
    inputSchema: z.object({
      title: z.string().describe("A short task title, in the user's original language"),
      scheduledDate: z
        .string()
        .nullable()
        .describe("ISO date (YYYY-MM-DD) resolved relative to the reference date, or null if none is implied"),
    }),
    run: async (input) => {
      const entry = await repo.createEntry(input)
      affected.add(entry.id)
      return `Created entry "${input.title}" (id: ${entry.id})`
    },
  })

  const updateEntry = betaZodTool({
    name: "update_entry",
    description: "Rename and/or reschedule an existing entry from Existing entries.",
    inputSchema: z.object({
      entryId: z.string().describe("id of an entry from Existing entries"),
      title: z.string().optional(),
      scheduledDate: z.string().nullable().optional(),
    }),
    run: async ({ entryId, ...patch }) => {
      const updated = await repo.updateEntry(entryId, patch)
      if (!updated) return `Error: entry ${entryId} not found`
      affected.add(entryId)
      return `Updated entry ${entryId}`
    },
  })

  const deleteEntry = betaZodTool({
    name: "delete_entry",
    description: "Permanently delete an existing entry. Only use when the user explicitly asks to remove/cancel a task.",
    inputSchema: z.object({ entryId: z.string().describe("id of an entry from Existing entries") }),
    run: async ({ entryId }) => {
      await repo.deleteEntry(entryId)
      affected.delete(entryId)
      return `Deleted entry ${entryId}`
    },
  })

  const addStage = betaZodTool({
    name: "add_stage",
    description:
      "Add an intermediate progress stage/milestone to an entry — one just created with create_entry, or an " +
      "existing one from Existing entries. Call once per stage the user wants added, in order.",
    inputSchema: z.object({
      entryId: z.string().describe("id of the entry to add the stage to"),
      label: z.string().describe("Stage name, in the user's original language"),
      date: z.string().nullable().describe("ISO date for this stage if mentioned, else null"),
    }),
    run: async ({ entryId, label, date }) => {
      const updated = await repo.addStage(entryId, { label, date })
      if (!updated) return `Error: entry ${entryId} not found`
      affected.add(entryId)
      return `Added stage "${label}" to entry ${entryId}`
    },
  })

  const updateStage = betaZodTool({
    name: "update_stage",
    description: "Rename, reschedule, or toggle completion of an existing progress stage.",
    inputSchema: z.object({
      entryId: z.string(),
      stageId: z.string().describe("id of an existing stage, from Existing entries"),
      label: z.string().optional(),
      date: z.string().nullable().optional(),
      done: z.boolean().optional(),
    }),
    run: async ({ entryId, stageId, ...patch }) => {
      const updated = await repo.updateStage(entryId, stageId, patch)
      if (!updated) return `Error: stage ${stageId} not found`
      affected.add(entryId)
      return `Updated stage ${stageId}`
    },
  })

  const deleteStage = betaZodTool({
    name: "delete_stage",
    description: "Delete an intermediate progress stage. The first and last stage of an entry cannot be deleted.",
    inputSchema: z.object({
      entryId: z.string(),
      stageId: z.string().describe("id of an existing, non-first/last stage, from Existing entries"),
    }),
    run: async ({ entryId, stageId }) => {
      const entry = await repo.getEntryById(entryId)
      if (!entry) return `Error: entry ${entryId} not found`
      if (!entry.stages.some((s) => s.id === stageId)) return `Error: stage ${stageId} not found`
      if (isProtectedStage(entry.stages, stageId)) return "Error: cannot delete the start/end stage"
      await repo.deleteStage(entryId, stageId)
      affected.add(entryId)
      return `Deleted stage ${stageId}`
    },
  })

  const addMemo = betaZodTool({
    name: "add_memo",
    description: "Add a memo/note to an entry — one just created with create_entry, or an existing one from Existing entries.",
    inputSchema: z.object({
      entryId: z.string().describe("id of the entry to add the memo to"),
      text: z.string().describe("The memo text, in the user's original language"),
    }),
    run: async ({ entryId, text }) => {
      const updated = await repo.addMemoLine(entryId, text)
      if (!updated) return `Error: entry ${entryId} not found`
      affected.add(entryId)
      return "Added memo"
    },
  })

  const updateMemo = betaZodTool({
    name: "update_memo",
    description: "Edit the text of an existing memo line.",
    inputSchema: z.object({
      entryId: z.string(),
      memoId: z.string().describe("id of an existing memo, from Existing entries"),
      text: z.string(),
    }),
    run: async ({ entryId, memoId, text }) => {
      const updated = await repo.updateMemoLine(entryId, memoId, text)
      if (!updated) return `Error: memo ${memoId} not found`
      affected.add(entryId)
      return "Updated memo"
    },
  })

  const deleteMemo = betaZodTool({
    name: "delete_memo",
    description: "Delete an existing memo line.",
    inputSchema: z.object({
      entryId: z.string(),
      memoId: z.string().describe("id of an existing memo, from Existing entries"),
    }),
    run: async ({ entryId, memoId }) => {
      const updated = await repo.deleteMemoLine(entryId, memoId)
      if (!updated) return `Error: memo ${memoId} not found`
      affected.add(entryId)
      return "Deleted memo"
    },
  })

  await client.beta.messages.toolRunner({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      `Today's date is ${referenceDate} (ISO format, YYYY-MM-DD). ` +
      "Resolve any relative or implicit date expressions (e.g. Korean '다음주 목요일', '내일', '이번주 금요일', " +
      "or a bare day-of-month like '22일') to absolute ISO dates relative to today.\n\n" +
      "Existing entries (JSON, with their ids, progress stages, and memos as of right now):\n" +
      JSON.stringify(summarizeEntries(existing)) +
      "\n\n" +
      "If the user's request refers to something already in this list (matching by title and/or date), " +
      "operate on THAT entry using update_entry / add_stage / update_stage / delete_stage / add_memo / " +
      "update_memo / delete_memo / delete_entry — never create a duplicate new entry for it.\n" +
      "If the user's text describes one or more tasks/events that are NOT already in the list, call " +
      "create_entry once per distinct new task, in the order mentioned.\n" +
      "Only add/change stages or memos the user explicitly asked for — don't invent them. add_stage/add_memo " +
      "need a target entryId: either the id returned by your own create_entry call this turn, or an id copied " +
      "from Existing entries above.",
    tools: [createEntry, updateEntry, deleteEntry, addStage, updateStage, deleteStage, addMemo, updateMemo, deleteMemo],
    messages: [{ role: "user", content: text }],
  })

  if (affected.size === 0) throw new Error("AI made no changes")
  const results = await Promise.all([...affected].map((id) => repo.getEntryById(id)))
  return results.filter((e): e is Entry => e !== undefined)
}
