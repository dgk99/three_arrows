import { useTranslation } from "react-i18next"
import { SUPPORTED_LANGUAGES } from "../i18n"
import "./LanguageToggle.css"

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  return (
    <div className="language-toggle">
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          className={i18n.language === lng ? "language-toggle-btn language-toggle-btn-active" : "language-toggle-btn"}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {t(`language.${lng}`)}
        </button>
      ))}
    </div>
  )
}
