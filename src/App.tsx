import { BrowserRouter, Routes, Route, useLocation, useRoutes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import CreateSessionPage from './pages/CreateSessionPage'
import ApplyPage from './pages/ApplyPage'
import DMPage from './pages/DMPage'
import MePage from './pages/MePage'
import HostDashboard from './pages/HostDashboard'
import SessionsPage from './pages/SessionsPage'
import JoinPage from './pages/JoinPage'
import NotFoundPage from './pages/NotFoundPage'
import CandidateProfilePage from './pages/CandidateProfilePage'
import PublicProfile from './pages/PublicProfile'
import NotificationsPage from './pages/NotificationsPage'
import DevLoopPage from './pages/DevLoopPage'
import BottomNav from './components/BottomNav'

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/sessions', element: <SessionsPage /> },
  { path: '/session/create', element: <CreateSessionPage /> },
  { path: '/session/:id', element: <SessionPage /> },
  { path: '/session/:id/apply', element: <ApplyPage /> },
  { path: '/session/:id/dm', element: <DMPage /> },
  { path: '/session/:id/host', element: <HostDashboard /> },
  { path: '/join/:code', element: <JoinPage /> },
  { path: '/me', element: <MePage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/profile/:userId', element: <PublicProfile /> },
  { path: '/session/:id/candidate/:applicantId', element: <CandidateProfilePage /> },
  { path: '/dev-loop', element: <DevLoopPage /> },
  { path: '*', element: <NotFoundPage /> },
]

function AnimatedRoutes() {
  const location = useLocation()
  const element = useRoutes(routes)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        style={{ minHeight: '100vh' }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatedRoutes />
        <BottomNav />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
