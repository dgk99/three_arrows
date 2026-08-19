import { Route, Routes } from "react-router-dom"
import { NavBar } from "./components/NavBar"
import { ChecklistPage } from "./pages/ChecklistPage"
import { PlanPage } from "./pages/PlanPage"

function App() {
  return (
    <div className="app">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ChecklistPage />} />
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
