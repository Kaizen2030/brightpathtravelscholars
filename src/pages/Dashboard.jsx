import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight, Globe2, MessageCircle, PenSquare, Send, User2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { supabase } from '../lib/supabaseClient'
import './Dashboard.css'

const STATUS_LABELS = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

function formatDate(value) {
  if (!value) return 'Date to be confirmed'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function Dashboard() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth()
  const { settings: siteSettings } = useSiteSettings()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    setProfileForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    })
  }, [profile?.full_name, profile?.phone])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, navigate, user])

  useEffect(() => {
    if (!user?.email) return undefined

    let ignore = false

    async function loadDashboardData() {
      setDataLoading(true)

      try {
        // Fetch both study and job applications
        const [studyResult, jobResult] = await Promise.all([
          supabase
            .from('applications')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false }),
          supabase
            .from('job_applications')
            .select('*')
            .eq('email', user.email)
            .order('created_at', { ascending: false }),
        ])

        const studyApps = (studyResult.data ?? []).map((a) => ({ ...a, application_type: 'study' }))
        const jobApps = (jobResult.data ?? []).map((a) => ({ ...a, application_type: 'job' }))

        // Merge and sort by most recent first
        const allApps = [...studyApps, ...jobApps].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        )

        const { data: registrationsData } = await supabase
          .from('event_registrations')
          .select('id, event_id, user_email, full_name, phone, created_at')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false })

        let eventsData = []
        const eventIds = (registrationsData || []).map((r) => r.event_id).filter(Boolean)

        if (eventIds.length) {
          const { data } = await supabase
            .from('events')
            .select('id, title, date, location')
            .in('id', eventIds)
            .order('date', { ascending: true })

          eventsData = data || []
        }

        if (ignore) return

        const eventMap = new Map(eventsData.map((e) => [e.id, e]))
        const joinedEvents = (registrationsData || [])
          .map((r) => ({ ...r, event: eventMap.get(r.event_id) || null }))
          .filter((r) => r.event)

        setApplications(allApps)
        setRegisteredEvents(joinedEvents)
      } catch (error) {
        console.error('[Dashboard] Failed to load dashboard data:', error)
      } finally {
        if (!ignore) setDataLoading(false)
      }
    }

    loadDashboardData()

    return () => { ignore = true }
  }, [user?.email])

  const firstName = useMemo(() => {
    const source = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Student'
    return source.split(' ')[0]
  }, [profile?.full_name, user?.email, user?.user_metadata?.full_name])

  async function handleProfileSave(event) {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')

    try {
      await updateProfile(profileForm)
      setProfileMessage('Your profile was updated successfully.')
      setModalOpen(false)
    } catch (error) {
      console.error('[Dashboard] Failed to update profile:', error)
      setProfileMessage(error.message || 'We could not update your profile right now.')
    } finally {
      setProfileSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-loading">
          <div className="container">
            <h1>Loading dashboard...</h1>
          </div>
        </section>
      </div>
    )
  }

  const latestApplication = applications[0] || null

  return (
    <div className="dashboard-page">
      <SEO
        title="Dashboard"
        description="View your Brightpath Travel Scholars application status, registered events, and profile details."
        path="/dashboard"
      />

      {modalOpen ? (
        <div className="dashboard-modal-backdrop">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2>Edit Profile</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <form className="dashboard-modal-form" onSubmit={handleProfileSave}>
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>

              <div className="dashboard-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="dashboard-hero">
        <div className="container">
          <span className="section-badge dashboard-hero-badge">Dashboard</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Track your applications, review your upcoming event registrations, and keep your profile current.</p>
        </div>
      </section>

      <AnimatedSection>
        <section className="dashboard-section">
          <div className="container dashboard-grid">

            {/* Applications card - shows all, latest highlighted */}
            <article className="dashboard-card dashboard-status-card">
              <div className="dashboard-card-header">
                <h2>My Applications</h2>
                {latestApplication && (
                  <span className={`dashboard-status-badge ${latestApplication.status || 'pending'}`}>
                    {STATUS_LABELS[latestApplication.status] || 'Pending'}
                  </span>
                )}
              </div>

              {dataLoading ? (
                <p>Loading your applications...</p>
              ) : applications.length ? (
                <div className="dashboard-apps-list">
                  {applications.map((app) => (
                    <div key={app.id} className="dashboard-app-item">
                      <div className="dashboard-app-item-top">
                        <span className={`dashboard-type-badge dashboard-type-badge--${app.application_type}`}>
                          {app.application_type === 'job' ? 'Work' : 'Study'}
                        </span>
                        <span className={`dashboard-status-badge ${app.status || 'pending'}`}>
                          {STATUS_LABELS[app.status] || 'Pending'}
                        </span>
                      </div>

                      {app.application_type === 'study' ? (
                        <div className="dashboard-app-details">
                          <p><strong>Destination:</strong> {app.destination || '—'}</p>
                          <p><strong>Intake:</strong> {app.intake || '—'}</p>
                          <p><strong>Course Type:</strong> {app.course_type || '—'}</p>
                          <p><strong>Field:</strong> {app.field_of_study || '—'}</p>
                        </div>
                      ) : (
                        <div className="dashboard-app-details">
                          <p><strong>Job ID:</strong> {app.job_id || '—'}</p>
                          <p><strong>Occupation:</strong> {app.current_occupation || '—'}</p>
                          <p><strong>Experience:</strong> {app.years_experience || '—'}</p>
                          <p><strong>Relocate Ready:</strong> {app.available_to_relocate ? 'Yes' : 'No'}</p>
                        </div>
                      )}

                      <p className="dashboard-app-date">Applied {formatDate(app.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <p>You have not submitted an application yet.</p>
                  <Link to="/apply" className="btn-primary">
                    Apply Now
                  </Link>
                </div>
              )}
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="dashboard-actions-grid">
                <Link to="/apply" className="dashboard-action-tile">
                  <Send size={18} />
                  <div>
                    <strong>Apply Now</strong>
                    <span>Submit a new study abroad application.</span>
                  </div>
                </Link>
                <Link to="/contact" className="dashboard-action-tile">
                  <Calendar size={18} />
                  <div>
                    <strong>Book Consultation</strong>
                    <span>Talk to a Brightpath counsellor.</span>
                  </div>
                </Link>
                <a
                  href={siteSettings.whatsapp_url || 'https://wa.me/15551234567'}
                  target="_blank"
                  rel="noreferrer"
                  className="dashboard-action-tile"
                >
                  <MessageCircle size={18} />
                  <div>
                    <strong>WhatsApp Support</strong>
                    <span>Reach the team directly.</span>
                  </div>
                </a>
                <Link to="/study-abroad" className="dashboard-action-tile">
                  <Globe2 size={18} />
                  <div>
                    <strong>Browse Destinations</strong>
                    <span>Compare countries and options.</span>
                  </div>
                </Link>
              </div>
            </article>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="dashboard-section alt">
          <div className="container dashboard-grid secondary">
            <article className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Upcoming Events</h2>
              </div>

              {dataLoading ? (
                <p>Loading your event registrations...</p>
              ) : registeredEvents.length ? (
                <div className="dashboard-events-list">
                  {registeredEvents.map((registration) => (
                    <div key={registration.id} className="dashboard-event-item">
                      <div>
                        <strong>{registration.event?.title}</strong>
                        <span>{formatDate(registration.event?.date)}</span>
                        <small>{registration.event?.location || 'Venue to be confirmed'}</small>
                      </div>
                      <ChevronRight size={18} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty">
                  <p>You have not registered for any events yet.</p>
                  <Link to="/events" className="btn-secondary">
                    Browse Events
                  </Link>
                </div>
              )}
            </article>

            <article className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Profile</h2>
                <button type="button" className="dashboard-edit-btn" onClick={() => setModalOpen(true)}>
                  <PenSquare size={16} />
                  Edit Profile
                </button>
              </div>

              <div className="dashboard-profile-list">
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-icon">
                    <User2 size={16} />
                  </span>
                  <div>
                    <strong>{profile?.full_name || 'Student Name'}</strong>
                    <span>Full name</span>
                  </div>
                </div>

                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-icon">@</span>
                  <div>
                    <strong>{user.email}</strong>
                    <span>Email address</span>
                  </div>
                </div>

                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-icon">#</span>
                  <div>
                    <strong>{profile?.phone || 'Not added yet'}</strong>
                    <span>Phone number</span>
                  </div>
                </div>
              </div>

              {profileMessage ? <p className="dashboard-profile-message">{profileMessage}</p> : null}
            </article>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Dashboard