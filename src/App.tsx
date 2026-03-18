import { BrowserRouter, useLocation, useRoutes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/Toast'
import HomePage from './pages/HomePage'
import SessionPage from './pages/SessionPage'
import CreateSessionPage from './pages/CreateSessionPage'
import ApplyPage from './pages/ApplyPage'
import DMPage from './pages/DMPage'
import GroupChatPage from './pages/GroupChatPage'
import MePage from './pages/MePage'
import HostDashboard from './pages/HostDashboard'
import SessionsPage from './pages/SessionsPage'
import JoinPage from './pages/JoinPage'
import NotFoundPage from './pages/NotFoundPage'
import CandidateProfilePage from './pages/CandidateProfilePage'
import PublicProfile from './pages/PublicProfile'
import NotificationsPage from './pages/NotificationsPage'
import DevLoopPage from './pages/DevLoopPage'
import DevTestMenu from './pages/DevTestMenu'
import EditSessionPage from './pages/EditSessionPage'
import GhostSetupPage from './pages/GhostSetupPage'
import GhostRecoverPage from './pages/GhostRecoverPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import ContactsPage from './pages/ContactsPage'
import GroupsPage from './pages/GroupsPage'
import ContactDetailPage from './pages/ContactDetailPage'
import ReviewPage from './pages/ReviewPage'
import ExplorePage from './pages/ExplorePage'
import BottomNav from './components/BottomNav'

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/sessions', element: <SessionsPage /> },
  { path: '/session/create', element: <CreateSessionPage /> },
  { path: '/session/:id', element: <SessionPage /> },
  { path: '/session/:id/apply', element: <ApplyPage /> },
  { path: '/session/:id/dm', element: <DMPage /> },
  { path: '/session/:id/dm/:peerId', element: <DMPage /> },
  { path: '/session/:id/chat', element: <GroupChatPage /> },
  { path: '/session/:id/host', element: <HostDashboard /> },
  { path: '/session/:id/edit', element: <EditSessionPage /> },
  { path: '/session/:id/review', element: <ReviewPage /> },
  { path: '/join/:code', element: <JoinPage /> },
  { path: '/ghost/setup', element: <GhostSetupPage /> },
  { path: '/ghost/recover', element: <GhostRecoverPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/me', element: <MePage /> },
  { path: '/contacts', element: <ContactsPage /> },
  { path: '/explore', element: <ExplorePage /> },
  { path: '/contacts/:contactUserId', element: <ContactDetailPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/profile/:userId', element: <PublicProfile /> },
  { path: '/session/:id/candidate/:applicantId', element: <CandidateProfilePage /> },
  { path: '/dev-loop', element: <DevLoopPage /> },
  { path: '/dev/test', element: <DevTestMenu /> },
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
        <ToastProvider />
        <AnimatedRoutes />
        <BottomNav />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
