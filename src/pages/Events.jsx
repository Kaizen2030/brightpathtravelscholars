import { useEffect, useMemo, useState } from 'react'
import { MapPin, Video } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { EVENT_FALLBACKS } from '../lib/eventCatalog'
import { usePageSections } from '../hooks/usePageSections'
import { getEventFallbackImage } from '../lib/fallbackImages'
import { supabase } from '../lib/supabaseClient'
import './Events.css'

const CATEGORY_LABELS = {
  university_open_day: 'University Open Day',
  visa_talk: 'Visa Talk',
  pre_departure: 'Pre-Departure',
  webinar: 'Webinar',
  scholarship: 'Scholarship',
}

const CATEGORY_GRADIENTS = {
  university_open_day: 'linear-gradient(145deg, #351553 0%, #5b2c89 100%)',
  visa_talk: 'linear-gradient(145deg, #5b3900 0%, #d4af37 100%)',
  pre_departure: 'linear-gradient(145deg, #12395f 0%, #2e8ab8 100%)',
  webinar: 'linear-gradient(145deg, #12374d 0%, #1fa0a0 100%)',
  scholarship: 'linear-gradient(145deg, #422066 0%, #8661c1 100%)',
}

function getEventStatusLabel(event) {
  if (event.is_past) return 'Past Event'
  if (event.is_online) return 'Live Online'
  return 'Upcoming Event'
}

function getEventActionLabel(event) {
  if (event.is_past) return 'View recap'
  if (event.is_online) return 'Register online'
  return 'Reserve spot'
}

function formatEventDate(value) {
  if (!value) return 'Date to be announced'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function Events() {
  const { sections } = usePageSections('events_page')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadEvents() {
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, title, date, location, description, image_url, register_url, is_online, category, is_past')
          .order('date', { ascending: true })

        if (ignore) return

        if (!error && data?.length) {
          setEvents(data)
        } else {
          setEvents(EVENT_FALLBACKS)
        }
      } catch (error) {
        console.error('[Events] Failed to load events:', error)
        if (!ignore) {
          setEvents(EVENT_FALLBACKS)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      ignore = true
    }
  }, [])

  const hero = sections.hero
  const upcoming = sections.upcoming
  const past = sections.past
  const newsletter = sections.newsletter
  const filters = hero.settings?.filters ?? []

  const { currentEvents, pastEvents } = useMemo(() => {
    const matchesFilter = (event) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'upcoming') return !event.is_past
      return event.category === activeFilter
    }

    const filtered = events.filter(matchesFilter)

    return {
      currentEvents: filtered.filter((event) => !event.is_past),
      pastEvents: filtered.filter((event) => event.is_past),
    }
  }, [activeFilter, events])

  function handleNewsletterSubmit(event) {
    event.preventDefault()

    if (!newsletterEmail.trim()) {
      setNewsletterStatus(newsletter.settings?.empty_message || 'Please enter your email address.')
      return
    }

    setNewsletterStatus(newsletter.settings?.success_message || 'Thanks. We will notify you about upcoming Brightpath events.')
    setNewsletterEmail('')
  }

  return (
    <div className="events-page">
      <SEO
        title="Events"
        description="Explore Brightpath Travel Scholars events including university open days, visa talks, webinars, scholarship sessions, and pre-departure briefings."
        path="/events"
      />

      <section className="events-hero">
        <div className="container">
          <span className="section-badge events-hero-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>
        </div>
      </section>

      <section className="events-filter-bar">
        <div className="container">
          <div className="events-filter-row" role="tablist" aria-label="Event filters">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`events-filter-chip${activeFilter === filter.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="events-section">
          <div className="container">
            <div className="events-section-header">
              <div>
                <span className="section-badge">{upcoming.badge_text}</span>
                <h2>{upcoming.heading}</h2>
              </div>
              <p>{upcoming.subheading}</p>
            </div>

            <div className="events-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <article key={`event-skeleton-${index}`} className="events-card skeleton-card">
                      <div className="events-card-media skeleton-block" />
                      <div className="events-card-content">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line" />
                        <div className="skeleton-line small" />
                        <div className="skeleton-line tiny" />
                      </div>
                    </article>
                  ))
                : currentEvents.map((event) => (
                    <article key={event.id} className={`events-card${event.is_past ? ' past-card' : ''}`}>
                      <div
                        className="events-card-media"
                        style={{
                          backgroundImage: event.image_url
                            ? `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.4)), url(${event.image_url})`
                            : `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.4)), url(${getEventFallbackImage(event.category, event.is_past)})`,
                        }}
                      >
                        <div className="events-card-media-topline">
                          <span className={`events-card-category events-card-category-${event.category || 'webinar'}`}>
                            {CATEGORY_LABELS[event.category] || 'Student Event'}
                          </span>
                          <span className={`events-status-badge${event.is_past ? ' muted' : ''}`}>
                            {getEventStatusLabel(event)}
                          </span>
                        </div>
                        <span className="events-date-badge">{formatEventDate(event.date)}</span>
                      </div>
                      <div className="events-card-content">
                        <h3>{event.title}</h3>
                        <p className="events-card-type">
                          {event.is_past
                            ? 'Archived session recap'
                            : event.is_online
                              ? 'Online event with live support'
                              : 'In-person student event'}
                        </p>
                        <div className="events-card-meta">
                          {event.is_online ? (
                            <span className="events-online-badge">
                              <Video size={15} />
                              Online
                            </span>
                          ) : (
                            <span>
                              <MapPin size={15} />
                              {event.location || 'Venue to be confirmed'}
                            </span>
                          )}
                        </div>
                        <details className="events-card-details">
                          <summary>{event.is_past ? 'View recap' : 'View details'}</summary>
                          <div className="events-card-details-panel">
                            <p className="events-card-description">{event.description}</p>
                            <div className="events-card-detail-grid">
                              <div className="events-card-detail">
                                <span>Date</span>
                                <strong>{formatEventDate(event.date)}</strong>
                              </div>
                              <div className="events-card-detail">
                                <span>Format</span>
                                <strong>{event.is_online ? 'Online' : 'In-person'}</strong>
                              </div>
                              <div className="events-card-detail">
                                <span>Location</span>
                                <strong>{event.location || 'Venue to be confirmed'}</strong>
                              </div>
                            </div>
                          </div>
                        </details>

                        {event.is_past ? (
                          <button type="button" className="events-card-action disabled" disabled>
                            Event archived
                          </button>
                        ) : event.register_url ? (
                          <a href={event.register_url} target="_blank" rel="noreferrer" className="events-card-action">
                            {getEventActionLabel(event)}
                          </a>
                        ) : (
                          <button type="button" className="events-card-action disabled" disabled>
                            Registration Closed
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
            </div>

            {!loading && currentEvents.length === 0 ? (
              <div className="events-empty-state">
                <h3>{upcoming.settings?.empty_heading}</h3>
                <p>{upcoming.settings?.empty_body}</p>
              </div>
            ) : null}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="events-section past">
          <div className="container">
            <div className="events-section-header">
              <div>
                <span className="section-badge">{past.badge_text}</span>
                <h2>{past.heading}</h2>
              </div>
              <p>{past.subheading}</p>
            </div>

            <div className="events-grid past-grid">
              {pastEvents.map((event) => (
                <article key={event.id} className="events-card past-card archived-card">
                  <div
                    className="events-card-media"
                    style={{
                      backgroundImage: event.image_url
                        ? `linear-gradient(rgba(51, 51, 51, 0.34), rgba(51, 51, 51, 0.56)), url(${event.image_url})`
                        : `linear-gradient(rgba(51, 51, 51, 0.34), rgba(51, 51, 51, 0.56)), url(${getEventFallbackImage(event.category, true)})`,
                    }}
                  >
                    <div className="events-card-media-topline">
                      <span className="events-card-category events-card-category-webinar">Archived</span>
                      <span className="events-status-badge muted">{getEventStatusLabel(event)}</span>
                    </div>
                    <span className="events-date-badge">{formatEventDate(event.date)}</span>
                  </div>
                  <div className="events-card-content">
                    <h3>{event.title}</h3>
                    <p className="events-card-type">Archived event recap</p>
                    <div className="events-card-meta">
                      {event.is_online ? (
                        <span className="events-online-badge">
                          <Video size={15} />
                          Online
                        </span>
                      ) : (
                        <span>
                          <MapPin size={15} />
                          {event.location || 'Venue to be confirmed'}
                        </span>
                      )}
                    </div>
                    <details className="events-card-details">
                      <summary>View recap</summary>
                      <div className="events-card-details-panel">
                        <p className="events-card-description">{event.description}</p>
                        <div className="events-card-detail-grid">
                          <div className="events-card-detail">
                            <span>Date</span>
                            <strong>{formatEventDate(event.date)}</strong>
                          </div>
                          <div className="events-card-detail">
                            <span>Format</span>
                            <strong>{event.is_online ? 'Online' : 'In-person'}</strong>
                          </div>
                          <div className="events-card-detail">
                            <span>Location</span>
                            <strong>{event.location || 'Venue to be confirmed'}</strong>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </article>
              ))}
            </div>

            {!pastEvents.length ? (
              <div className="events-empty-state subtle">
                <p>{past.settings?.empty_body}</p>
              </div>
            ) : null}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="events-newsletter">
          <div className="container">
            <div className="events-newsletter-panel">
              <div>
                <span className="section-badge">{newsletter.badge_text}</span>
                <h2>{newsletter.heading}</h2>
                <p>{newsletter.subheading}</p>
              </div>

              <form className="events-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder={newsletter.settings?.placeholder || 'Enter your email'}
                  aria-label="Email address"
                />
                <button type="submit" className="btn-primary">
                  {newsletter.primary_btn_text || 'Subscribe'}
                </button>
              </form>
              {newsletterStatus ? <p className="events-newsletter-status">{newsletterStatus}</p> : null}
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Events
