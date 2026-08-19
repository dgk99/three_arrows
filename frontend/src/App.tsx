import { Route, Routes } from "react-router-dom"
import { NavBar } from "./components/NavBar"
import { ContentTranslationProvider } from "./contexts/ContentTranslationContext"
import { ChecklistPage } from "./pages/ChecklistPage"
import { PlanPage } from "./pages/PlanPage"

function App() {
  return (
    <ContentTranslationProvider>
      <div className="app">
        <NavBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ChecklistPage />} />
            <Route path="/plan" element={<PlanPage />} />
          </Routes>
        </main>
      </div>
    </ContentTranslationProvider>
  )
}

export default App
