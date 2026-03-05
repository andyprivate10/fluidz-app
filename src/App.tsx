import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import CreateSessionPage from './pages/CreateSessionPage'
import ApplyPage from './pages/ApplyPage'
import DMPage from './pages/DMPage'
import MePage from './pages/MePage'
import HostDashboard from './pages/HostDashboard'
import SessionsPage from './pages/SessionsPage'
import BottomNav from './components/BottomNav'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/session/create" element={<CreateSessionPage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/session/:id/apply" element={<ApplyPage />} />
        <Route path="/session/:id/dm" element={<DMPage />} />
        <Route path="/session/:id/host" element={<HostDashboard />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
