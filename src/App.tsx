import { BrowserRouter, useLocation, useRoutes, Navigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/Toast'
import { AuthProvider } from './contexts/AuthContext'
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
import BottomNav from './components/BottomNav'
import RequireAuth from './components/RequireAuth'
// InstallPrompt and PushPrompt disabled for now
// import InstallPrompt from './components/InstallPrompt'
// import PushPrompt from './components/PushPrompt'

// Lazy-loaded pages
const SessionPage = lazy(() => import('./pages/SessionPage'))
const CreateSessionPage = lazy(() => import('./pages/CreateSessionPage'))
const ApplyPage = lazy(() => import('./pages/ApplyPage'))
const DMPage = lazy(() => import('./pages/DMPage'))
const GroupChatPage = lazy(() => import('./pages/GroupChatPage'))
const MePage = lazy(() => import('./pages/MePage'))
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
const WelcomeTutorial = lazy(() => import('./pages/WelcomeTutorial'))
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
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const VibeScorePage = lazy(() => import('./pages/VibeScorePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const MessageTemplatesPage = lazy(() => import('./pages/MessageTemplatesPage'))

function HostRedirect() { const { id } = useParams(); return <Navigate to={`/session/${id}`} replace /> }

const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/landing', element: <LandingPage /> },
  { path: '/sessions', element: <RequireAuth><SessionsPage /></RequireAuth> },
  { path: '/session/create', element: <RequireAuth><CreateSessionPage /></RequireAuth> },
  { path: '/session/:id', element: <SessionPage /> },
  { path: '/session/:id/apply', element: <RequireAuth><ApplyPage /></RequireAuth> },
  { path: '/session/:id/dm', element: <RequireAuth><DMPage /></RequireAuth> },
  { path: '/session/:id/dm/:peerId', element: <RequireAuth><DMPage /></RequireAuth> },
  { path: '/session/:id/chat', element: <RequireAuth><GroupChatPage /></RequireAuth> },
  { path: '/session/:id/host', element: <HostRedirect /> },
  { path: '/session/:id/edit', element: <RequireAuth><EditSessionPage /></RequireAuth> },
  { path: '/session/:id/review', element: <RequireAuth><ReviewPage /></RequireAuth> },
  { path: '/join/:code', element: <JoinPage /> },
  { path: '/ghost/setup', element: <GhostSetupPage /> },
  { path: '/ghost/recover', element: <GhostRecoverPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/welcome', element: <WelcomeTutorial /> },
  { path: '/me', element: <RequireAuth><MePage /></RequireAuth> },
  { path: '/contacts', element: <RequireAuth><ContactsPage /></RequireAuth> },
  { path: '/explore', element: <RequireAuth><ExplorePage /></RequireAuth> },
  { path: '/chats', element: <RequireAuth><ChatsHubPage /></RequireAuth> },
  { path: '/dm/:peerId', element: <RequireAuth><DirectDMPage /></RequireAuth> },
  { path: '/addresses', element: <RequireAuth><AddressesPage /></RequireAuth> },
  { path: '/contacts/:contactUserId', element: <RequireAuth><ContactDetailPage /></RequireAuth> },
  { path: '/groups', element: <RequireAuth><GroupsPage /></RequireAuth> },
  { path: '/favorites', element: <RequireAuth><FavoritesPage /></RequireAuth> },
  { path: '/me/templates', element: <RequireAuth><TemplatesPage /></RequireAuth> },
  { path: '/me/addresses', element: <RequireAuth><AddressesPage /></RequireAuth> },
  { path: '/me/messages', element: <RequireAuth><MessageTemplatesPage /></RequireAuth> },
  { path: '/settings', element: <RequireAuth><SettingsPage /></RequireAuth> },
  { path: '/vibe-score', element: <RequireAuth><VibeScorePage /></RequireAuth> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/notifications', element: <RequireAuth><NotificationsPage /></RequireAuth> },
  { path: '/profile/:userId', element: <PublicProfile /> },
  { path: '/session/:id/candidate/:applicantId', element: <CandidateProfilePage /> },
  { path: '/admin', element: <RequireAuth><AdminPage /></RequireAuth> },
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
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider />
          <Suspense fallback={<LazyFallback />}><AnimatedRoutes /></Suspense>
          <BottomNav />
          {/* InstallPrompt and PushPrompt disabled — too early in user journey */}
          {/* <InstallPrompt /> */}
          {/* <PushPrompt /> */}
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
