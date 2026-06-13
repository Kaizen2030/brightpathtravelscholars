import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Activity,
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
import { fetchCached, clearCache } from '../../lib/dataCache'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { SITE_SETTING_FIELDS } from '../../lib/siteSettings'
import CertificateBuilder from './CertificateBuilder'
import PageContentManager from './PageContentManager'
import AnalyticsPanel from './AnalyticsPanel'
import './AdminDashboard.css'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'applications', label: 'Applications', icon: FileText },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'blog', label: 'Blog Posts', icon: Megaphone },
  { key: 'testimonials', label: 'Testimonials', icon: Star },
  { key: 'team', label: 'Team Members', icon: Users },
  { key: 'certificates', label: 'IELTS Builder', icon: FileText },
  { key: 'analytics', label: 'Analytics', icon: Activity },
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

const SETTINGS_SECTIONS = [
  {
    key: 'basic',
    title: 'Basic Info',
    description: 'Name the site and set the main public web address.',
  },
  {
    key: 'contact',
    title: 'Contact & Support',
    description: 'Control the email, phone, and WhatsApp details people will use to reach you.',
  },
  {
    key: 'social',
    title: 'Social Links',
    description: 'Paste your live social profile URLs so the footer and contact page stay up to date.',
  },
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
const EMPTY_BLOG_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  author_name: '',
  category: '',
  published_at: '',
  is_published: false,
}
const EMPTY_TESTIMONIAL_FORM = {
  author_name: '',
  author_title: '',
  author_photo_url: '',
  rating: 5,
  review_text: '',
  is_published: false,
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

function slugifyText(value) {
  return `${value ?? ''}`
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  return SITE_SETTING_FIELDS.reduce((accumulator, item) => {
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
  const [adminProfiles, setAdminProfiles] = useState(cachedDashboard?.adminProfiles ?? [])
  const [settingsRows, setSettingsRows] = useState(cachedDashboard?.settingsRows ?? [])
  const [settingsForm, setSettingsForm] = useState(buildSettingsForm(cachedDashboard?.settingsRows ?? []))
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM)
  const [eventSaving, setEventSaving] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM)
  const [teamSaving, setTeamSaving] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [blogModalOpen, setBlogModalOpen] = useState(false)
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM)
  const [blogSaving, setBlogSaving] = useState(false)
  const [editingBlogId, setEditingBlogId] = useState(null)
  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false)
  const [testimonialForm, setTestimonialForm] = useState(EMPTY_TESTIMONIAL_FORM)
  const [testimonialSaving, setTestimonialSaving] = useState(false)
  const [editingTestimonialId, setEditingTestimonialId] = useState(null)
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
          adminProfiles,
          settingsRows,
        }),
      )
    } catch {
      // Ignore storage issues and keep the dashboard usable.
    }
  }, [adminProfiles, applications, events, isAdmin, posts, settingsRows, teamMembers, testimonials, user?.id])

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
        // Fetch sequentially to avoid too many concurrent network requests
        const applicationsResult = await supabase.from('applications').select('*').order('created_at', { ascending: false })
        if (applicationsResult.error) throw applicationsResult.error
        if (ignore) return

        const eventsResult = await supabase.from('events').select('*').order('date', { ascending: false })
        if (eventsResult.error) throw eventsResult.error
        if (ignore) return

        const postsResult = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
        if (postsResult.error) throw postsResult.error
        if (ignore) return

        const testimonialsResult = await supabase.from('testimonials').select('*').order('created_at', { ascending: false })
        if (testimonialsResult.error) throw testimonialsResult.error
        if (ignore) return

        const teamData = await fetchCached(
          'team_members',
          async () => {
            const { data, error } = await supabase.from('team_members').select('*').order('order_index', { ascending: true })
            if (error) throw error
            return data ?? []
          },
          5 * 60 * 1000,
        )
        if (ignore) return

        const adminProfilesResult = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, role, created_at')
          .eq('role', 'admin')
          .order('created_at', { ascending: false })
        if (adminProfilesResult.error) throw adminProfilesResult.error
        if (ignore) return

        const nextSettings = await fetchCached(
          'site_settings',
          async () => {
            const { data, error } = await supabase.from('site_settings').select('*').order('key', { ascending: true })
            if (error) throw error
            return data ?? []
          },
          5 * 60 * 1000,
        )

        setApplications(applicationsResult.data ?? [])
        setEvents(eventsResult.data ?? [])
        setPosts(postsResult.data ?? [])
        setTestimonials(testimonialsResult.data ?? [])
        setTeamMembers(sortByOrderThenName(teamData ?? []))
        setAdminProfiles(adminProfilesResult.data ?? [])
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
  }, [cachedDashboard, isAdmin, user?.id])

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

  function openBlogEditor(post) {
    if (!post) {
      setEditingBlogId(null)
      setBlogForm(EMPTY_BLOG_FORM)
      setBlogModalOpen(true)
      return
    }

    setEditingBlogId(post.id)
    setBlogForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      cover_image_url: post.cover_image_url || '',
      author_name: post.author_name || '',
      category: post.category || '',
      published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '',
      is_published: Boolean(post.is_published),
    })
    setBlogModalOpen(true)
  }

  function resetBlogModal() {
    setBlogForm(EMPTY_BLOG_FORM)
    setEditingBlogId(null)
    setBlogModalOpen(false)
  }

  function openTestimonialEditor(testimonial) {
    if (!testimonial) {
      setEditingTestimonialId(null)
      setTestimonialForm(EMPTY_TESTIMONIAL_FORM)
      setTestimonialModalOpen(true)
      return
    }

    setEditingTestimonialId(testimonial.id)
    setTestimonialForm({
      author_name: testimonial.author_name || '',
      author_title: testimonial.author_title || '',
      author_photo_url: testimonial.author_photo_url || '',
      rating: testimonial.rating ?? 5,
      review_text: testimonial.review_text || '',
      is_published: Boolean(testimonial.is_published),
    })
    setTestimonialModalOpen(true)
  }

  function resetTestimonialModal() {
    setTestimonialForm(EMPTY_TESTIMONIAL_FORM)
    setEditingTestimonialId(null)
    setTestimonialModalOpen(false)
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

  async function handleBlogSubmit(event) {
    event.preventDefault()
    setBlogSaving(true)
    setNotice(null)

    try {
      const isPublished = Boolean(blogForm.is_published)
      const publishedAt = isPublished
        ? blogForm.published_at
          ? new Date(blogForm.published_at).toISOString()
          : editingBlogId
            ? posts.find((item) => item.id === editingBlogId)?.published_at || new Date().toISOString()
            : new Date().toISOString()
        : null

      const payload = {
        id: editingBlogId || createRowId(),
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim(),
        excerpt: blogForm.excerpt.trim(),
        content: blogForm.content.trim(),
        cover_image_url: blogForm.cover_image_url.trim(),
        author_name: blogForm.author_name.trim(),
        category: blogForm.category.trim(),
        published_at: publishedAt,
        is_published: isPublished,
      }

      if (editingBlogId) {
        const { data, error } = await supabase.from('blog_posts').update(payload).eq('id', editingBlogId).select().single()
        if (error) throw error
        setPosts((current) => current.map((item) => (item.id === editingBlogId ? data : item)))
        setNotice({ type: 'success', text: 'Blog post updated.' })
      } else {
        const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
        if (error) throw error
        setPosts((current) => [data, ...current].sort((left, right) => new Date(right.published_at || right.created_at) - new Date(left.published_at || left.created_at)))
        setNotice({ type: 'success', text: 'Blog post created.' })
      }

      resetBlogModal()
    } catch (error) {
      console.error('[AdminDashboard] Failed to save blog post:', error)
      setNotice({ type: 'error', text: error.message || 'Could not save the blog post.' })
    } finally {
      setBlogSaving(false)
    }
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault()
    setTestimonialSaving(true)
    setNotice(null)

    try {
      const payload = {
        id: editingTestimonialId || createRowId(),
        author_name: testimonialForm.author_name.trim(),
        author_title: testimonialForm.author_title.trim(),
        author_photo_url: testimonialForm.author_photo_url.trim(),
        rating: Number(testimonialForm.rating) || 5,
        review_text: testimonialForm.review_text.trim(),
        is_published: Boolean(testimonialForm.is_published),
      }

      if (editingTestimonialId) {
        const { data, error } = await supabase
          .from('testimonials')
          .update(payload)
          .eq('id', editingTestimonialId)
          .select()
          .single()

        if (error) throw error
        setTestimonials((current) => current.map((item) => (item.id === editingTestimonialId ? data : item)))
        setNotice({ type: 'success', text: 'Testimonial updated.' })
      } else {
        const { data, error } = await supabase.from('testimonials').insert(payload).select().single()

        if (error) throw error
        setTestimonials((current) => [data, ...current])
        setNotice({ type: 'success', text: 'Testimonial created.' })
      }

      resetTestimonialModal()
    } catch (error) {
      console.error('[AdminDashboard] Failed to save testimonial:', error)
      setNotice({ type: 'error', text: error.message || 'Could not save the testimonial.' })
    } finally {
      setTestimonialSaving(false)
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
        // Invalidate cached team members so UI elsewhere shows updates
        try {
          clearCache('team_members')
        } catch {
          // ignore cache errors
        }
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
        try {
          clearCache('team_members')
        } catch {
          // ignore
        }
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
      const payload = SITE_SETTING_FIELDS.map((item) => {
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
      try {
        clearCache('site_settings')
      } catch {
        // ignore
      }
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
                  <td data-label="Name">{application.full_name}</td>
                  <td data-label="Email">{application.email}</td>
                  <td data-label="Phone">{application.phone || 'Not provided'}</td>
                  <td data-label="Scholarship">{extractScholarshipInterest(application.field_of_study) || 'General application'}</td>
                  <td data-label="Destination">{application.destination || 'Pending'}</td>
                  <td data-label="University">{application.institution || 'Not specified'}</td>
                  <td data-label="Intake">{application.intake || 'Pending'}</td>
                  <td data-label="Status">
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
                  <td data-label="Date Applied">{formatDate(application.created_at)}</td>
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
                  <td data-label="Title">{item.title}</td>
                  <td data-label="Date">{formatDateTime(item.date)}</td>
                  <td data-label="Location">{item.location || 'Not set'}</td>
                  <td data-label="Category">{humanizeKey(item.category)}</td>
                  <td data-label="Mode">{item.is_online ? 'Online' : 'In person'}</td>
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
          <div>
            <h2>Blog Posts</h2>
            <p>{posts.length} post records</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => openBlogEditor(null)}>
            Add Blog Post
          </button>
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
                  <td data-label="Title">{post.title}</td>
                  <td data-label="Category">{post.category || 'General'}</td>
                  <td data-label="Author">{post.author_name || 'Brightpath Team'}</td>
                  <td data-label="Published">{post.is_published ? 'Published' : 'Draft'}</td>
                  <td data-label="Views">{post.view_count || 0}</td>
                  <td data-label="Actions">
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="admin-btn admin-btn-soft"
                        onClick={() => openBlogEditor(post)}
                      >
                        Edit
                      </button>
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
          <div>
            <h2>Testimonials</h2>
            <p>{testimonials.length} testimonials</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => openTestimonialEditor(null)}>
            Add Testimonial
          </button>
        </div>
        <div className="admin-compact-list">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="admin-review-item">
              <div>
                <strong>{testimonial.author_name}</strong>
                <span>{testimonial.author_title || 'Student review'}</span>
                <p>{testimonial.review_text}</p>
              </div>
              <div className="admin-action-row">
                <button
                  type="button"
                  className="admin-btn admin-btn-soft"
                  onClick={() => openTestimonialEditor(testimonial)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`admin-btn ${testimonial.is_published ? 'admin-btn-soft' : 'admin-btn-primary'}`}
                  onClick={() => handleTestimonialToggle(testimonial)}
                >
                  {testimonial.is_published ? 'Reject' : 'Approve'}
                </button>
              </div>
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
                  <td data-label="Name">{member.name}</td>
                  <td data-label="Role">{member.role}</td>
                  <td data-label="Order">{member.order_index ?? 0}</td>
                  <td data-label="Bio">{member.bio || 'No bio added yet.'}</td>
                  <td data-label="Actions">
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
                        <td data-label="Name">{foundUser.full_name || 'Unnamed user'}</td>
                        <td data-label="Email">{foundUser.email}</td>
                        <td data-label="Phone">{foundUser.phone || 'Not provided'}</td>
                        <td data-label="Role">{humanizeKey(foundUser.role || 'user')}</td>
                        <td data-label="Actions">
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

        <section className="admin-panel-card">
          <div className="admin-panel-card-header">
            <div>
              <h2>Admin Users</h2>
              <p>{adminProfiles.length} users with admin access</p>
            </div>
          </div>
          <div className="admin-compact-list">
            {adminProfiles.map((adminUser) => (
              <div key={adminUser.id} className="admin-compact-item">
                <div>
                  <strong>{adminUser.full_name || adminUser.email}</strong>
                  <span>{adminUser.email}</span>
                </div>
                <small>{profile?.id === adminUser.id ? 'You' : 'Admin'}</small>
              </div>
            ))}
            {!adminProfiles.length ? <p className="admin-empty">No admin users found.</p> : null}
          </div>
        </section>
      </div>
    )
  }

  function renderSettings() {
    const previewSiteName = settingsForm.site_name?.trim() || 'Brightpath Travel Scholars'
    const previewTagline = settingsForm.site_tagline?.trim() || "Your Gateway to the World's Best Universities"
    const previewSiteUrl = settingsForm.site_url?.trim() || 'https://brightpathtravelscholars.com'
    const previewContactEmail = settingsForm.contact_email?.trim() || 'info@brightpathtravelscholars.com'
    const previewContactPhone = settingsForm.contact_phone?.trim() || '+1 (555) 123-4567'
    const previewWhatsAppUrl = settingsForm.whatsapp_url?.trim() || 'https://wa.me/15551234567'
    const previewSocialLinks = [
      { label: 'Facebook', url: settingsForm.facebook_url?.trim() || '' },
      { label: 'Instagram', url: settingsForm.instagram_url?.trim() || '' },
      { label: 'X', url: settingsForm.x_url?.trim() || '' },
      { label: 'YouTube', url: settingsForm.youtube_url?.trim() || '' },
      { label: 'LinkedIn', url: settingsForm.linkedin_url?.trim() || '' },
    ].filter((item) => item.url)

    return (
      <section className="admin-panel-card">
        <div className="admin-panel-card-header">
          <h2>Settings</h2>
          <p>Edit your site configuration values.</p>
        </div>
        <p className="admin-content-hint">
          Add the full profile URL for each social network so the footer and contact links point to your live accounts.
        </p>
        <div className="admin-settings-layout">
          <form className="admin-settings-form" onSubmit={handleSettingsSave}>
            <div className="admin-settings-sections">
              {SETTINGS_SECTIONS.map((section) => {
                const fields = SITE_SETTING_FIELDS.filter((item) => item.group === section.key)

                return (
                  <section key={section.key} className="admin-settings-section">
                    <div className="admin-settings-section-header">
                      <div>
                        <h3>{section.title}</h3>
                        <p>{section.description}</p>
                      </div>
                    </div>
                    <div className="admin-settings-grid">
                      {fields.map((item) => (
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
                    </div>
                  </section>
                )
              })}
            </div>
            <button type="submit" className="admin-btn admin-btn-primary admin-save-btn" disabled={settingsSaving}>
              <Save size={16} />
              {settingsSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>

          <aside className="admin-settings-preview">
            <div className="admin-settings-preview-header">
              <div>
                <h3>Live Preview</h3>
                <p>See what the footer and support links will look like when saved.</p>
              </div>
              <span className="admin-settings-preview-badge">Preview</span>
            </div>

            <div className="admin-settings-preview-card">
              <span className="section-badge">Footer</span>
              <h4>{previewSiteName}</h4>
              <p className="admin-settings-preview-tagline">{previewTagline}</p>
              <p className="admin-settings-preview-url">{previewSiteUrl}</p>

              <div className="admin-settings-preview-contact">
                <div>
                  <span>Contact Email</span>
                  <strong>{previewContactEmail}</strong>
                </div>
                <div>
                  <span>Contact Phone</span>
                  <strong>{previewContactPhone}</strong>
                </div>
                <a href={previewWhatsAppUrl} target="_blank" rel="noreferrer" className="admin-settings-preview-link">
                  WhatsApp link
                </a>
              </div>
            </div>

            <div className="admin-settings-preview-card">
              <span className="section-badge">Socials</span>
              <h4>Connected profiles</h4>
              <div className="admin-settings-preview-socials">
                {previewSocialLinks.length ? (
                  previewSocialLinks.map((item) => (
                    <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="admin-settings-preview-link">
                      {item.label}
                    </a>
                  ))
                ) : (
                  <p className="admin-empty">Add at least one social link to preview it here.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
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
      case 'certificates':
        return <CertificateBuilder />
      case 'analytics':
        return <AnalyticsPanel />
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

      {blogModalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingBlogId ? 'Edit Blog Post' : 'Add Blog Post'}</h3>
              <button type="button" className="admin-icon-btn" onClick={resetBlogModal}>
                <X size={18} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleBlogSubmit}>
              <label className="admin-field">
                <span>Title</span>
                <input
                  type="text"
                  value={blogForm.title}
                  onChange={(event) =>
                    setBlogForm((current) => {
                      const nextTitle = event.target.value
                      const autoSlugSource = current.title || nextTitle
                      const shouldAutoFill = !editingBlogId || !current.slug || current.slug === slugifyText(autoSlugSource)

                      return {
                        ...current,
                        title: nextTitle,
                        slug: shouldAutoFill ? slugifyText(nextTitle) : current.slug,
                      }
                    })
                  }
                  required
                />
              </label>

              <label className="admin-field">
                <span>Slug</span>
                <input
                  type="text"
                  value={blogForm.slug}
                  onChange={(event) => setBlogForm((current) => ({ ...current, slug: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Category</span>
                <input
                  type="text"
                  value={blogForm.category}
                  onChange={(event) => setBlogForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Study Abroad"
                />
              </label>

              <label className="admin-field">
                <span>Author Name</span>
                <input
                  type="text"
                  value={blogForm.author_name}
                  onChange={(event) => setBlogForm((current) => ({ ...current, author_name: event.target.value }))}
                  placeholder="Brightpath Team"
                />
              </label>

              <label className="admin-field">
                <span>Cover Image URL</span>
                <input
                  type="url"
                  value={blogForm.cover_image_url}
                  onChange={(event) =>
                    setBlogForm((current) => ({ ...current, cover_image_url: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field admin-field-full">
                <span>Excerpt</span>
                <textarea
                  rows="3"
                  value={blogForm.excerpt}
                  onChange={(event) => setBlogForm((current) => ({ ...current, excerpt: event.target.value }))}
                />
              </label>

              <label className="admin-field admin-field-full">
                <span>Content</span>
                <textarea
                  rows="8"
                  value={blogForm.content}
                  onChange={(event) => setBlogForm((current) => ({ ...current, content: event.target.value }))}
                  required
                />
              </label>

              <label className="admin-field">
                <span>Published At</span>
                <input
                  type="datetime-local"
                  value={blogForm.published_at}
                  onChange={(event) =>
                    setBlogForm((current) => ({ ...current, published_at: event.target.value }))
                  }
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={blogForm.is_published}
                  onChange={(event) =>
                    setBlogForm((current) => ({ ...current, is_published: event.target.checked }))
                  }
                />
                <span>Publish this post</span>
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-soft" onClick={resetBlogModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={blogSaving}>
                  {blogSaving ? 'Saving...' : editingBlogId ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {testimonialModalOpen ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingTestimonialId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button type="button" className="admin-icon-btn" onClick={resetTestimonialModal}>
                <X size={18} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleTestimonialSubmit}>
              <label className="admin-field">
                <span>Author Name</span>
                <input
                  type="text"
                  value={testimonialForm.author_name}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, author_name: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="admin-field">
                <span>Author Title</span>
                <input
                  type="text"
                  value={testimonialForm.author_title}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, author_title: event.target.value }))
                  }
                  placeholder="Studied in Canada"
                />
              </label>

              <label className="admin-field">
                <span>Photo URL</span>
                <input
                  type="url"
                  value={testimonialForm.author_photo_url}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, author_photo_url: event.target.value }))
                  }
                />
              </label>

              <label className="admin-field">
                <span>Rating</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonialForm.rating}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, rating: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="admin-field admin-field-full">
                <span>Review Text</span>
                <textarea
                  rows="6"
                  value={testimonialForm.review_text}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, review_text: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={testimonialForm.is_published}
                  onChange={(event) =>
                    setTestimonialForm((current) => ({ ...current, is_published: event.target.checked }))
                  }
                />
                <span>Publish this testimonial</span>
              </label>

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-soft" onClick={resetTestimonialModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={testimonialSaving}>
                  {testimonialSaving ? 'Saving...' : editingTestimonialId ? 'Save Changes' : 'Create Testimonial'}
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
