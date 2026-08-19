import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import ja from "./locales/ja.json"
import ko from "./locales/ko.json"

export const SUPPORTED_LANGUAGES = ["ko", "en", "ja"] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const STORAGE_KEY = "planly-language"

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) return stored as SupportedLanguage
  return "ko"
}

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: getInitialLanguage(),
  fallbackLng: "ko",
  interpolation: { escapeValue: false },
})

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
