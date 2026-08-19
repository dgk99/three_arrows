import type { Entry } from "../types/entry"

const BASE_URL = import.meta.env.VITE_API_URL

export const aiApi = {
  async runAssistant(text: string, referenceDate: string): Promise<Entry[]> {
    const res = await fetch(`${BASE_URL}/ai/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, referenceDate }),
    })
    if (!res.ok) throw new Error(`AI assistant failed: ${res.status}`)
    return res.json()
  },
}
