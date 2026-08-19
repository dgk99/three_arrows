const BASE_URL = import.meta.env.VITE_API_URL

export const translateApi = {
  async translateTexts(texts: string[], targetLanguage: string): Promise<Record<string, string>> {
    if (texts.length === 0) return {}
    const res = await fetch(`${BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, targetLanguage }),
    })
    if (!res.ok) throw new Error(`Translate failed: ${res.status}`)
    const data = await res.json()
    return data.translations
  },
}
