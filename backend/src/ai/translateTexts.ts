import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { Pool } from "pg"
import { z } from "zod"

const client = new Anthropic()

const LANGUAGE_NAMES: Record<string, string> = {
  ko: "Korean",
  en: "English",
  ja: "Japanese",
}

const TranslationSchema = z.object({
  translations: z.array(z.string()).describe("Translated strings, same order and count as the input list"),
})

async function translateViaAi(texts: string[], targetLanguage: string): Promise<string[]> {
  const languageName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system:
      `Translate each string in the given JSON array into ${languageName}. ` +
      "These are short to-do list items: task titles, notes, or progress-step names. " +
      "Keep translations short and natural, matching the original tone. Return exactly one translation " +
      "per input string, in the same order — do not merge, skip, or add items.",
    messages: [{ role: "user", content: JSON.stringify(texts) }],
    output_config: { format: zodOutputFormat(TranslationSchema) },
  })

  if (!response.parsed_output || response.parsed_output.translations.length !== texts.length) {
    throw new Error("Translation output did not match input")
  }
  return response.parsed_output.translations
}

export async function translateTexts(
  pool: Pool,
  texts: string[],
  targetLanguage: string
): Promise<Record<string, string>> {
  const unique = [...new Set(texts.map((t) => t.trim()).filter((t) => t.length > 0))]
  if (unique.length === 0) return {}

  const { rows } = await pool.query<{ source_text: string; translated_text: string }>(
    `SELECT source_text, translated_text FROM translations WHERE target_language = $1 AND source_text = ANY($2)`,
    [targetLanguage, unique]
  )
  const cache = new Map(rows.map((r) => [r.source_text, r.translated_text]))
  const missing = unique.filter((t) => !cache.has(t))

  if (missing.length > 0) {
    const translated = await translateViaAi(missing, targetLanguage)
    for (let i = 0; i < missing.length; i++) {
      cache.set(missing[i], translated[i])
    }
    const values: string[] = []
    const params: unknown[] = []
    missing.forEach((source, i) => {
      params.push(source, targetLanguage, translated[i])
      values.push(`($${params.length - 2}, $${params.length - 1}, $${params.length})`)
    })
    await pool.query(
      `INSERT INTO translations (source_text, target_language, translated_text) VALUES ${values.join(", ")}
       ON CONFLICT (source_text, target_language) DO NOTHING`,
      params
    )
  }

  const result: Record<string, string> = {}
  for (const original of texts) {
    const trimmed = original.trim()
    result[original] = trimmed ? (cache.get(trimmed) ?? original) : original
  }
  return result
}
