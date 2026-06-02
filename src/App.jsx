import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { recordPageView, touchAnalyticsSession } from './lib/analytics'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import StudyAbroad from './pages/StudyAbroad'
import Community from './pages/Community'
import Contact from './pages/Contact'
import Apply from './pages/Apply'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import ScholarshipDetail from './pages/ScholarshipDetail'
import UniversityDetail from './pages/UniversityDetail'
import AdminDashboard from './pages/admin/AdminDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const canAccessRoute = Boolean(user)

  if (loading && !canAccessRoute) {
    return <div className="route-status">Loading your account...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const canAccessAdmin = Boolean(user && isAdmin)

  if (loading && !canAccessAdmin) {
    return <div className="route-status">Checking admin access...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

function AnalyticsTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const lastTrackedRouteRef = useRef('')

  useEffect(() => {
    const pathname = `${location.pathname}${location.search}`

    if (location.pathname.startsWith('/admin')) {
      return undefined
    }

    if (lastTrackedRouteRef.current === pathname) {
      return undefined
    }

    lastTrackedRouteRef.current = pathname

    let ignore = false

    void recordPageView({
      pathname,
      title: document.title,
      user,
    }).catch((error) => {
      if (!ignore) {
        console.warn('[Analytics] Page view tracking failed:', error)
      }
    })

    return () => {
      ignore = true
    }
  }, [location.pathname, location.search, user?.id])

  useEffect(() => {
    const pathname = `${location.pathname}${location.search}`

    if (location.pathname.startsWith('/admin')) {
      return undefined
    }

    const heartbeat = () => {
      void touchAnalyticsSession({
        pathname,
        title: document.title,
        user,
      }).catch((error) => {
        console.warn('[Analytics] Heartbeat tracking failed:', error)
      })
    }

    heartbeat()
    const timer = window.setInterval(heartbeat, 30000)

    return () => {
      window.clearInterval(timer)
    }
  }, [location.pathname, location.search, user?.id])

  return null
}

function AppLayout() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="app-shell">
      <ScrollToTop />
      <AnalyticsTracker />
      {!isAdminPage && <Navbar />}
      <main className={isAdminPage ? 'app-main admin-main' : 'app-main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/community" element={<Community />} />
          <Route path="/study-abroad" element={<StudyAbroad />} />
          <Route path="/study-abroad/:countrySlug" element={<StudyAbroad />} />
          <Route path="/scholarships/:scholarshipSlug" element={<ScholarshipDetail />} />
          <Route path="/scholarships/:scholarshipSlug/apply" element={<Apply />} />
          <Route path="/universities/:universitySlug" element={<UniversityDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
