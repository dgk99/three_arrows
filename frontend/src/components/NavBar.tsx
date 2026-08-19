import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import { LanguageToggle } from "./LanguageToggle"
import "./NavBar.css"

export function NavBar() {
  const { t } = useTranslation()

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "navlink navlink-active" : "navlink")}>
          {t("nav.checklist")}
        </NavLink>
        <NavLink to="/plan" className={({ isActive }) => (isActive ? "navlink navlink-active" : "navlink")}>
          {t("nav.plan")}
        </NavLink>
      </div>
      <LanguageToggle />
    </nav>
  )
}
