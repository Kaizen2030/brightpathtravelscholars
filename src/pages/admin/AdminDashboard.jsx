import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  Save,
  Settings,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import PageContentManager from './PageContentManager'
import './AdminDashboard.css'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'applications', label: 'Applications', icon: FileText },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'blog', label: 'Blog Posts', icon: Megaphone },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'team', label: 'Team Members', icon: Users },
  { key: 'content', label: 'Page Content', icon: Megaphone },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const APPLICATION_STATUSES = ['pending', 'reviewing', 'accepted', 'rejected']
const EVENT_CATEGORIES = [
  'university_open_day',
  'visa_talk',
  'pre_departure',
  'webinar',
  'scholarship',
]

const DEFAULT_SETTINGS = [
  { key: 'site_name', label: 'Site Name', defaultValue: 'Brightpath Travel Scholars' },
  {
    key: 'site_tagline',
    label: 'Site Tagline',
    defaultValue: "Your Gateway to the World's Best Universities",
  },
  { key: 'site_url', label: 'Site URL', defaultValue: 'https://brightpathtravelscholars.com' },
  { key: 'contact_email', label: 'Contact Email', defaultValue: 'info@brightpathtravelscholars.com' },
  { key: 'whatsapp_url', label: 'WhatsApp URL', defaultValue: 'https://wa.me/254734004003' },
]

const EMPTY_EVENT_FORM = {
  title: '',
  date: '',
  location: '',
  description: '',
  image_url: '',
  register_url: '',
  category: 'university_open_day',
  is_online: false,
}

const EMPTY_TEAM_FORM = {
  name: '',
  role: '',
  bio: '',
  photo_url: '',
  order_index: 0,
}
const ADMIN_ACTIVE_SECTION_STORAGE_KEY = 'brightpath-admin-active-section'
const ADMIN_DASHBOARD_CACHE_STORAGE_KEY = 'brightpath-admin-dashboard-cache-v1'

function readAdminDashboardCache() {
  try {
    const rawValue = window.sessionStorage.getItem(ADMIN_DASHBOARD_CACHE_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

function createRowId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function humanizeKey(value) {
  return (value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function extractScholarshipInterest(value) {
  const match = `${value ?? ''}`.match(/Scholarship Interest:\s*(.+)$/i)
  return match?.[1]?.trim() || ''
}

function buildSettingsForm(rows) {
  return DEFAULT_SETTINGS.reduce((accumulator, item) => {
    const existing = rows.find((row) => row.key === item.key)
    accumulator[item.key] = existing?.value ?? item.defaultValue
    return accumulator
  }, {})
}

function sortByOrderThenName(items) {
  return [...items].sort((left, right) => {
    const orderGap = (left.order_index ?? 0) - (right.order_index ?? 0)
    if (orderGap !== 0) return orderGap
    return (left.name || '').localeCompare(right.name || '')
  })
}

function AdminDashboard() {
  const cachedDashboard = readAdminDashboardCache()
  const { user, profile, isAdmin, loading: authLoading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const canRenderAdmin = Boolean(user && isAdmin)
  const [activeSection, setActiveSection] = useState(() => {
    try {
      const savedSection = window.sessionStorage.getItem(ADMIN_ACTIVE_SECTION_STORAGE_KEY)
      return NAV_ITEMS.some((item) => item.key === savedSection) ? savedSection : 'overview'
    } catch {
      return 'overview'
    }
  })
  const [loading, setLoading] = useState(!cachedDashboard)
  const [notice, setNotice] = useState(null)
  const [applications, setApplications] = useState(cachedDashboard?.applications ?? [])
  const [events, setEvents] = useState(cachedDashboard?.events ?? [])
  const [posts, setPosts] = useState(cachedDashboard?.posts ?? [])
  const [testimonials, setTestimonials] = useState(cachedDashboard?.testimonials ?? [])
  const [teamMembers, setTeamMembers] = useState(cachedDashboard?.teamMembers ?? [])
  const [settingsRows, setSettingsRows] = useState(cachedDashboard?.settingsRows ?? [])
  const [settingsForm, setSettingsForm] = useState(buildSettingsForm(cachedDashboard?.settingsRows ?? []))
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM)
  const [eventSaving, setEventSaving] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM)
  const [teamSaving, setTeamSaving] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [userSearchEmail, setUserSearchEmail] = useState('')
  const [userSearchLoading, setUserSearchLoading] = useState(false)
  const [userSearchResults, setUserSearchResults] = useState([])
  const [userSearchError, setUserSearchError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [authLoading, isAdmin, navigate])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(ADMIN_ACTIVE_SECTION_STORAGE_KEY, activeSection)
    } catch {
      // Ignore storage issues and keep the dashboard usable.
    }
  }, [activeSection])

  useEffect(() => {
    if (!user?.id || !isAdmin) return

    try {
      window.sessionStorage.setItem(
        ADMIN_DASHBOARD_CACHE_STORAGE_KEY,
        JSON.stringify({
          applications,
          events,
          posts,
          testimonials,
          teamMembers,
          settingsRows,
        }),
      )
    } catch {
      // Ignore storage issues and keep the dashboard usable.
    }
  }, [applications, events, isAdmin, posts, settingsRows, teamMembers, testimonials, user?.id])

  useEffect(() => {
    if (!user?.id || !isAdmin) return undefined

    let ignore = false

    async function loadAdminData() {
      const hasCachedData = Boolean(cachedDashboard)
      if (!hasCachedData) {
        setLoading(true)
      }
      setNotice(null)

      try {
        const [
          applicationsResult,
          eventsResult,
          postsResult,
          testimonialsResult,
          teamResult,
          settingsResult,
        ] = await Promise.all([
          supabase.from('applications').select('*').order('created_at', { ascending: false }),
          supabase.from('events').select('*').order('date', { ascending: false }),
          supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
          supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
          supabase.from('team_members').select('*').order('order_index', { ascending: true }),
          supabase.from('site_settings').select('*').order('key', { ascending: true }),
        ])

        const firstError = [
          applicationsResult.error,
          eventsResult.error,
          postsResult.error,
          testimonialsResult.error,
          teamResult.error,
          settingsResult.error,
        ].find(Boolean)

        if (firstError) throw firstError
        if (ignore) return

        const nextSettings = settingsResult.data ?? []

        setApplications(applicationsResult.data ?? [])
        setEvents(eventsResult.data ?? [])
        setPosts(postsResult.data ?? [])
        setTestimonials(testimonialsResult.data ?? [])
        setTeamMembers(sortByOrderThenName(teamResult.data ?? []))
        setSettingsRows(nextSettings)
        setSettingsForm(buildSettingsForm(nextSettings))
      } catch (error) {
        console.error('[AdminDashboard] Failed to load admin data:', error)
        if (!ignore) {
          setNotice({
            type: 'error',
            text: error.message || 'We could not load the admin dashboard right now.',
          })
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAdminData()

    return () => {
      ignore = true
    }
  }, [isAdmin, user?.id])

  const overviewStats = useMemo(
    () => [
      { label: 'Total Applications', value: applications.length },
      {
        label: 'Pending Applications',
        value: applications.filter((item) => item.status === 'pending').length,
      },
      {
        label: 'Upcoming Events',
        value: events.filter((item) => item.date && new Date(item.date) >= new Date()).length,
      },
      {
        label: 'Published Blog Posts',
        value: posts.filter((item) => item.is_published).length,
      },
    ],
    [applications, events, posts],
  )

  function resetEventModal() {
    setEventForm(EMPTY_EVENT_FORM)
    setEventModalOpen(false)
  }

  function resetTeamModal() {
    setTeamForm(EMPTY_TEAM_FORM)
    setEditingTeamId(null)
    setTeamModalOpen(false)
  }

  async function handleApplicationStatusChange(applicationId, nextStatus) {
    const previousApplications = applications
    setApplications((current) =>
      current.map((item) => (item.id === applicationId ? { ...item, status: nextStatus } : item)),
    )

    try {
      const { error } = await supabase.from('applications').update({ status: nextStatus }).eq('id', applicationId)

      if (error) throw error

      setNotice({ type: 'success', text: 'Application status updated.' })
    } catch (error) {
      console.error('[AdminDashboard] Failed to update application status:', error)
      setApplications(previousApplications)
      setNotice({ type: 'error', text: error.message || 'Could not update the application status.' })
    }
  }

  async function handleEventSubmit(event) {
    event.preventDefault()
    setEventSaving(true)
    setNotice(null)

    try {
      const payload = {
        id: createRowId(),
        title: eventForm.title.trim(),
        date: eventForm.date,
        location: eventForm.is_online ? 'Online' : eventForm.location.trim(),
        description: eventForm.description.trim(),
        image_url: eventForm.image_url.trim(),
        register_url: eventForm.register_url.trim(),
        category: eventForm.category,
        is_online: eventForm.is_online,
        is_past: eventForm.date ? new Date(eventForm.date) < new Date() : false,
      }

      const { data, error } = await supabase.from('events').insert(payload).select().single()

      if (error) throw error

      setEvents((current) => [data, ...current].sort((left, right) => new Date(right.date) - new Date(left.date)))
      setNotice({ type: 'success', text: 'Event created successfully.' })
      resetEventModal()
    } catch (error) {
      console.error('[AdminDashboard] Failed to create event:', error)
      setNotice({ type: 'error', text: error.message || 'Could not create the event.' })
    } finally {
      setEventSaving(false)
    }
  }

  async function handlePostPublishToggle(post) {
    const nextPublished = !post.is_published
    const updates = {
      is_published: nextPublished,
      published_at: nextPublished && !post.published_at ? new Date().toISOString() : post.published_at,
    }

    try {
      const { error } = await supabase.from('blog_posts').update(updates).eq('id', post.id)

      if (error) throw error

      setPosts((current) =>
        current.map((item) => (item.id === post.id ? { ...item, ...updates } : item)),
      )
      setNotice({
        type: 'success',
        text: nextPublished ? 'Post published successfully.' : 'Post unpublished successfully.',
      })
    } catch (error) {
      console.error('[AdminDashboard] Failed to toggle post state:', error)
      setNotice({ type: 'error', text: error.message || 'Could not update the post.' })
    }
  }

  async function handlePostDelete(postId) {
    const shouldDelete = window.confirm('Delete this blog post permanently?')
    if (!shouldDelete) return

    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', postId)
      if (error) throw error

      setPosts((current) => current.filter((item) => item.id !== postId))
      setNotice({ type: 'success', text: 'Blog post deleted.' })
    } catch (error) {
      console.error('[AdminDashboard] Failed to delete blog post:', error)
      setNotice({ type: 'error', text: error.message || 'Could not delete the blog post.' })
    }
  }

  async function handleTestimonialToggle(testimonial) {
    const nextValue = !testimonial.is_published

    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_published: nextValue })
        .eq('id', testimonial.id)

      if (error) throw error

      setTestimonials((current) =>
        current.map((item) =>
          item.id === testimonial.id ? { ...item, is_published: nextValue } : item,
        ),
      )
      setNotice({
        type: 'success',
        text: nextValue ? 'Testimonial approved.' : 'Testimonial moved back to draft.',
      })
    } catch (error) {
      console.error('[AdminDashboard] Failed to update testimonial:', error)
      setNotice({ type: 'error', text: error.message || 'Could not update the testimonial.' })
    }
  }

  function openTeamEditor(member) {
    if (!member) {
      setEditingTeamId(null)
      setTeamForm(EMPTY_TEAM_FORM)
      setTeamModalOpen(true)
      return
    }

    setEditingTeamId(member.id)
    setTeamForm({
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      photo_url: member.photo_url || '',
      order_index: member.order_index ?? 0,
    })
    setTeamModalOpen(true)
  }

  async function handleTeamSubmit(event) {
    event.preventDefault()
    setTeamSaving(true)
    setNotice(null)

    try {
      const payload = {
        id: editingTeamId || createRowId(),
        name: teamForm.name.trim(),
        role: teamForm.role.trim(),
        bio: teamForm.bio.trim(),
        photo_url: teamForm.photo_url.trim(),
        order_index: Number(teamForm.order_index) || 0,
      }

      if (editingTeamId) {
        const { data, error } = await supabase.from('team_members').update(payload).eq('id', editingTeamId).select().single()

        if (error) throw error

        setTeamMembers((current) =>
          sortByOrderThenName(current.map((item) => (item.id === editingTeamId ? data : item))),
        )
        setNotice({ type: 'success', text: 'Team member updated.' })
      } else {
        const { data, error } = await supabase.from('team_members').insert(payload).select().single()

        if (error) throw error

        setTeamMembers((current) => sortByOrderThenName([...current, data]))
        setNotice({ type: 'success', text: 'Team member added.' })
      }

      resetTeamModal()
    } catch (error) {
      console.error('[AdminDashboard] Failed to save team member:', error)
      setNotice({ type: 'error', text: error.message || 'Could not save the team member.' })
    } finally {
      setTeamSaving(false)
    }
  }

  async function handleTeamDelete(memberId) {
    const shouldDelete = window.confirm('Delete this team member?')
    if (!shouldDelete) return

    try {
      const { error } = await supabase.from('team_members').delete().eq('id', memberId)
      if (error) throw error

      setTeamMembers((current) => current.filter((item) => item.id !== memberId))
      setNotice({ type: 'success', text: 'Team member deleted.' })
    } catch (error) {
      console.error('[AdminDashboard] Failed to delete team member:', error)
      setNotice({ type: 'error', text: error.message || 'Could not delete the team member.' })
    }
  }

  async function handleSettingsSave(event) {
    event.preventDefault()
    setSettingsSaving(true)
    setNotice(null)

    try {
      const payload = DEFAULT_SETTINGS.map((item) => {
        const existing = settingsRows.find((row) => row.key === item.key)
        return {
          id: existing?.id || createRowId(),
          key: item.key,
          value: settingsForm[item.key]?.trim() || '',
          updated_at: new Date().toISOString(),
        }
      })

      const { data, error } = await supabase.from('site_settings').upsert(payload, { onConflict: 'key' }).select()

      if (error) throw error

      const nextRows = data ?? payload
      setSettingsRows(nextRows)
      setSettingsForm(buildSettingsForm(nextRows))
      setNotice({ type: 'success', text: 'Site settings saved.' })
    } catch (error) {
      console.error('[AdminDashboard] Failed to save settings:', error)
      setNotice({ type: 'error', text: error.message || 'Could not save the settings.' })
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleUserSearch(event) {
    event.preventDefault()
    const emailQuery = userSearchEmail.trim()

    if (!emailQuery) {
      setUserSearchError('Type an email address to find a user.')
      setUserSearchResults([])
      return
    }

    setUserSearchLoading(true)
    setUserSearchError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, role, created_at')
        .ilike('email', `%${emailQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setUserSearchResults(data ?? [])

      if (!(data?.length ?? 0)) {
        setUserSearchError('No users matched that email.')
      }
    } catch (error) {
      console.error('[AdminDashboard] User search failed:', error)
      setUserSearchResults([])
      setUserSearchError(error.message || 'Could not search users right now.')
    } finally {
      setUserSearchLoading(false)
    }
  }

  async function handleUserRoleChange(profileId, nextRole) {
    const previousResults = userSearchResults

    setUserSearchResults((current) =>
      current.map((item) => (item.id === profileId ? { ...item, role: nextRole } : item)),
    )

    try {
      const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', profileId)

      if (error) throw error

      if (profile?.id === profileId) {
        await refreshProfile(profileId)
        setNotice({
          type: 'success',
          text: nextRole === 'admin' ? 'Your access level was updated to admin.' : 'Admin access was removed.',
        })
      } else {
        setNotice({
          type: 'success',
          text: nextRole === 'admin' ? 'User promoted to admin.' : 'User changed back to regular user.',
        })
      }
    } catch (error) {
      console.error('[AdminDashboard] Failed to update user role:', error)
      setUserSearchResults(previousResults)
      setNotice({ type: 'error', text: error.message || 'Could not update the user role.' })
    }
  }

  function renderOverview() {
    return (
      <div className="admin-section-stack">
        <div className="admin-stat-grid">
          {overviewStats.map((item) => (
            <article key={item.label} className="admin-stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-split-grid">
          <section className="admin-panel-card">
            <div className="admin-panel-card-header">
              <h2>Recent Applications</h2>
            </div>
            <div className="admin-compact-list">
              {applications.slice(0, 5).map((application) => (
                <div key={application.id} className="admin-compact-item">
                  <div>
                    <strong>{application.full_name}</strong>
                    <span>
                      {application.institution || extractScholarshipInterest(application.field_of_study) || application.destination || 'Destination pending'} |{' '}
                      {application.intake || 'Intake pending'}
                    </span>
                  </div>
                  <small>{application.status || 'pending'}</small>
                </div>
              ))}
              {!applications.length ? <p className="admin-empty">No applications yet.</p> : null}
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card-header">
              <h2>Admin Access</h2>
            </div>
            <div className="admin-access-card">
              <ShieldCheck size={22} />
              <div>
                <strong>{profile?.full_name || user?.email}</strong>
                <span>Signed in as admin</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  function renderApplications() {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <h2>Applications</h2>
          <p>{applications.length} submissions</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Scholarship</th>
                <th>Destination</th>
                <th>University</th>
                <th>Intake</th>
                <th>Status</th>
                <th>Date Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.full_name}</td>
                  <td>{application.email}</td>
                  <td>{application.phone || 'Not provided'}</td>
                  <td>{extractScholarshipInterest(application.field_of_study) || 'General application'}</td>
                  <td>{application.destination || 'Pending'}</td>
                  <td>{application.institution || 'Not specified'}</td>
                  <td>{application.intake || 'Pending'}</td>
                  <td>
                    <select
                      className="admin-select"
                      value={application.status || 'pending'}
                      onChange={(event) =>
                        handleApplicationStatusChange(application.id, event.target.value)
                      }
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {humanizeKey(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDate(application.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length ? <p className="admin-empty">No applications available.</p> : null}
        </div>
      </section>
    )
  }

  function renderEvents() {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <div>
            <h2>Events</h2>
            <p>{events.length} event records</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setEventModalOpen(true)}>
            Add Event
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Category</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {events.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{item.location || 'Not set'}</td>
                  <td>{humanizeKey(item.category)}</td>
                  <td>{item.is_online ? 'Online' : 'In person'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!events.length ? <p className="admin-empty">No events available.</p> : null}
        </div>
      </section>
    )
  }

  function renderBlog() {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <h2>Blog Posts</h2>
          <p>{posts.length} post records</p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Published</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.category || 'General'}</td>
                  <td>{post.author_name || 'Brightpath Team'}</td>
                  <td>{post.is_published ? 'Published' : 'Draft'}</td>
                  <td>{post.view_count || 0}</td>
                  <td>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="admin-btn admin-btn-soft"
                        onClick={() => handlePostPublishToggle(post)}
                      >
                        {post.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        onClick={() => handlePostDelete(post.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!posts.length ? <p className="admin-empty">No blog posts available.</p> : null}
        </div>
      </section>
    )
  }

  function renderTestimonials() {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <h2>Testimonials</h2>
          <p>{testimonials.length} testimonials</p>
        </div>
        <div className="admin-compact-list">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="admin-review-item">
              <div>
                <strong>{testimonial.author_name}</strong>
                <span>{testimonial.author_title || 'Student review'}</span>
                <p>{testimonial.review_text}</p>
              </div>
              <button
                type="button"
                className={`admin-btn ${testimonial.is_published ? 'admin-btn-soft' : 'admin-btn-primary'}`}
                onClick={() => handleTestimonialToggle(testimonial)}
              >
                {testimonial.is_published ? 'Reject' : 'Approve'}
              </button>
            </div>
          ))}
          {!testimonials.length ? <p className="admin-empty">No testimonials available.</p> : null}
        </div>
      </section>
    )
  }

  function renderTeam() {
    return (
      <div className="admin-section-stack">
        <section className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div>
              <h2>Team Members</h2>
              <p>{teamMembers.length} team profiles</p>
            </div>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => openTeamEditor(null)}>
              Add Team Member
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Order</th>
                  <th>Bio</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>{member.order_index ?? 0}</td>
                    <td>{member.bio || 'No bio added yet.'}</td>
                    <td>
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-btn admin-btn-soft"
                          onClick={() => openTeamEditor(member)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleTeamDelete(member.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!teamMembers.length ? <p className="admin-empty">No team members available.</p> : null}
          </div>
        </section>

        <section className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div>
              <h2>User Access by Email</h2>
              <p>Search registered users and promote selected accounts to admin.</p>
            </div>
          </div>

          <form className="admin-user-search" onSubmit={handleUserSearch}>
            <label className="admin-field admin-field-full">
              <span>Email address</span>
              <input
                type="email"
                value={userSearchEmail}
                onChange={(event) => setUserSearchEmail(event.target.value)}
                placeholder="find a user by email"
              />
            </label>

            <button type="submit" className="admin-btn admin-btn-primary" disabled={userSearchLoading}>
              {userSearchLoading ? 'Searching...' : 'Search Users'}
            </button>
          </form>

          {userSearchError ? <p className="admin-empty admin-search-message">{userSearchError}</p> : null}

          {userSearchResults.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userSearchResults.map((foundUser) => {
                    const isAdminUser = foundUser.role === 'admin'
                    return (
                      <tr key={foundUser.id}>
                        <td>{foundUser.full_name || 'Unnamed user'}</td>
                        <td>{foundUser.email}</td>
                        <td>{foundUser.phone || 'Not provided'}</td>
                        <td>{humanizeKey(foundUser.role || 'user')}</td>
                        <td>
                          <div className="admin-action-row">
                            <button
                              type="button"
                              className={`admin-btn ${isAdminUser ? 'admin-btn-soft' : 'admin-btn-primary'}`}
                              onClick={() => handleUserRoleChange(foundUser.id, isAdminUser ? 'user' : 'admin')}
                            >
                              {isAdminUser ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    )
  }

  function renderSettings() {
    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <h2>Settings</h2>
          <p>Edit your site configuration values.</p>
        </div>
        <form className="admin-settings-form" onSubmit={handleSettingsSave}>
          {DEFAULT_SETTINGS.map((item) => (
            <label key={item.key} className="admin-field">
              <span>{item.label}</span>
              <input
                type="text"
                value={settingsForm[item.key] || ''}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, [item.key]: event.target.value }))
                }
              />
            </label>
          ))}
          <button type="submit" className="admin-btn admin-btn-primary admin-save-btn" disabled={settingsSaving}>
            <Save size={16} />
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </section>
    )
  }

  function renderActiveSection() {
    switch (activeSection) {
      case 'applications':
        return renderApplications()
      case 'events':
        return renderEvents()
      case 'blog':
        return renderBlog()
      case 'testimonials':
        return renderTestimonials()
      case 'team':
        return renderTeam()
      case 'settings':
        return renderSettings()
      case 'content':
        return <PageContentManager />
      case 'overview':
      default:
        return renderOverview()
    }
  }

  if (authLoading && !canRenderAdmin) {
    return <div className="route-status">Loading admin dashboard...</div>
  }

  if (!canRenderAdmin) {
    return null
  }

  return (
    <div className="admin-dashboard">
      <SEO
        title="Admin Dashboard"
        description="Manage Brightpath Travel Scholars applications, events, content, and settings."
        path="/admin"
        noindex
      />

      <aside className="admin-sidebar-shell">
        <div className="admin-brand">
          <span className="section-badge">Admin</span>
          <h1>Brightpath Travel Scholars</h1>
          <p>Operations hub for applications, events, content, and site settings.</p>
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={16} />
            <span>Back to Website</span>
          </Link>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-nav-item${activeSection === item.key ? ' active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="admin-main-shell">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-eyebrow">{humanizeKey(activeSection)}</span>
            <h2>{NAV_ITEMS.find((item) => item.key === activeSection)?.label || 'Overview'}</h2>
          </div>
          <div className="admin-topbar-meta">
            <Link to="/" className="admin-back-link compact">
              <ArrowLeft size={16} />
              <span>Website</span>
            </Link>
            <strong>{profile?.full_name || user.email}</strong>
            <span>{user.email}</span>
          </div>
        </header>

        {notice ? (
          <div className={`admin-notice ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</div>
        ) : null}

        {loading ? <div className="admin-loading">Loading dashboard data...</div> : renderActiveSection()}
      </main>

      {eventModalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Add Event</h3>
              <button type="button" className="admin-icon-btn" onClick={resetEventModal}>
                <X size={18} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleEventSubmit}>
              <label className="admin-field">
                <span>Title</span>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Date</span>
                <input
                  type="datetime-local"
                  value={eventForm.date}
                  onChange={(event) => setEventForm((current) => ({ ...current, date: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Location</span>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, location: event.target.value }))
                  }
                  disabled={eventForm.is_online}
                  placeholder={eventForm.is_online ? 'Online event' : 'United States'}
                />
              </label>

              <label className="admin-field">
                <span>Description</span>
                <textarea
                  rows="4"
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, description: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="admin-field">
                <span>Image URL</span>
                <input
                  type="url"
                  value={eventForm.image_url}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, image_url: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Register URL</span>
                <input
                  type="url"
                  value={eventForm.register_url}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, register_url: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Category</span>
                <select
                  value={eventForm.category}
                  onChange={(event) => setEventForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {humanizeKey(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={eventForm.is_online}
                  onChange={(event) =>
                    setEventForm((current) => ({ ...current, is_online: event.target.checked }))
                  }
                />
                <span>This is an online event</span>
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-soft" onClick={resetEventModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={eventSaving}>
                  {eventSaving ? 'Saving...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {teamModalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingTeamId ? 'Edit Team Member' : 'Add Team Member'}</h3>
              <button type="button" className="admin-icon-btn" onClick={resetTeamModal}>
                <X size={18} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleTeamSubmit}>
              <label className="admin-field">
                <span>Name</span>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Role</span>
                <input
                  type="text"
                  value={teamForm.role}
                  onChange={(event) => setTeamForm((current) => ({ ...current, role: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Bio</span>
                <textarea
                  rows="4"
                  value={teamForm.bio}
                  onChange={(event) => setTeamForm((current) => ({ ...current, bio: event.target.value }))}
                />
              </label>

              <label className="admin-field">
                <span>Photo URL</span>
                <input
                  type="url"
                  value={teamForm.photo_url}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, photo_url: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Order Index</span>
                <input
                  type="number"
                  value={teamForm.order_index}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, order_index: event.target.value }))
                  }
                />
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-soft" onClick={resetTeamModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={teamSaving}>
                  {teamSaving ? 'Saving...' : editingTeamId ? 'Save Changes' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminDashboard
