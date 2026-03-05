import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import ApplyPage from './pages/ApplyPage'
import DMPage from './pages/DMPage'
import MePage from './pages/MePage'
import CreateSessionPage from './pages/CreateSessionPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/create" element={<CreateSessionPage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/session/:id/apply" element={<ApplyPage />} />
        <Route path="/session/:id/dm" element={<DMPage />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
    </BrowserRouter>
  )
}
