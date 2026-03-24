import { BrowserRouter, useLocation, useRoutes } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/Toast'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'

// Lazy-loaded pages
const SessionPage = lazy(() => import('./pages/SessionPage'))
const CreateSessionPage = lazy(() => import('./pages/CreateSessionPage'))
const ApplyPage = lazy(() => import('./pages/ApplyPage'))
const DMPage = lazy(() => import('./pages/DMPage'))
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'))
const MePage = lazy(() => import('./pages/MePage'))
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const SessionsPage = lazy(() => import('./pages/SessionsPage'))
const JoinPage = lazy(() => import('./pages/JoinPage'))
const CandidateProfilePage = lazy(() => import('./pages/CandidateProfilePage'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const DevLoopPage = lazy(() => import('./pages/DevLoopPage'))
const DevTestMenu = lazy(() => import('./pages/DevTestMenu'))
const EditSessionPage = lazy(() => import('./pages/EditSessionPage'))
const GhostSetupPage = lazy(() => import('./pages/GhostSetupPage'))
const GhostRecoverPage = lazy(() => import('./pages/GhostRecoverPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))
const GroupsPage = lazy(() => import('./pages/GroupsPage'))
const ContactDetailPage = lazy(() => import('./pages/ContactDetailPage'))
const ReviewPage = lazy(() => import('./pages/SessionReviewFlow'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ChatsHubPage = lazy(() => import('./pages/ChatsHubPage'))
const DirectDMPage = lazy(() => import('./pages/DirectDMPage'))
const AddressesPage = lazy(() => import('./pages/AddressesPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/landing', element: <LandingPage /> },
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
  { path: '/chats', element: <ChatsHubPage /> },
  { path: '/dm/:peerId', element: <DirectDMPage /> },
  { path: '/addresses', element: <AddressesPage /> },
  { path: '/contacts/:contactUserId', element: <ContactDetailPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/favorites', element: <FavoritesPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/profile/:userId', element: <PublicProfile /> },
  { path: '/session/:id/candidate/:applicantId', element: <CandidateProfilePage /> },
  { path: '/admin', element: <AdminPage /> },
  ...(import.meta.env.DEV ? [
    { path: '/dev-loop', element: <DevLoopPage /> },
    { path: '/dev/test', element: <DevTestMenu /> },
  ] : []),
  { path: '*', element: <NotFoundPage /> },
]

const LazyFallback = () => (
  <div style={{ minHeight: '100vh', background: '#05040A', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ width: 28, height: 28, border: '2px solid rgba(224,136,122,0.3)', borderTopColor: '#E0887A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

function AnimatedRoutes() {
  const location = useLocation()
  const element = useRoutes(routes)
  // Scroll to top on route change
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
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
        <Suspense fallback={<LazyFallback />}><AnimatedRoutes /></Suspense>
        <BottomNav />
        <InstallPrompt />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
