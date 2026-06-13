/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Award,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  Globe,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Warehouse,
} from 'lucide-react'
import AnimatedCount from '../components/AnimatedCount'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { UPCOMING_EVENT_FALLBACKS } from '../lib/eventCatalog'
import { mergeDestinationCards } from '../lib/destinationGuides'
import { HERO_FALLBACK_IMAGES, HERO_FALLBACK_IMAGE, getDestinationFallbackImage, getEventFallbackImage } from '../lib/fallbackImages'
import { buildJobApplyPath, buildJobDetailPath, JOB_CATALOG } from '../lib/jobCatalog'
import { usePageSections } from '../hooks/usePageSections'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { buildOverlayBackground } from '../lib/mediaStyles'
import { getPageSectionDefaults } from '../lib/pageSections'
import { supabase } from '../lib/supabaseClient'
import { WHATSAPP_URL } from '../lib/siteConfig'
import './Home.css'

const STEP_ICONS = [Phone, BookOpen, Award, Globe, Users]

const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    author_name: 'Sharon W.',
    author_title: 'Studied in Canada',
    rating: 5,
    review_text:
      'Brightpath made the entire process feel clear. From course selection to visa paperwork, their team stayed ahead of every deadline.',
  },
  {
    id: 'fallback-2',
    author_name: 'Brian M.',
    author_title: 'Studied in the UK',
    rating: 5,
    review_text:
      'I started with a free consultation and ended up with a university offer I genuinely loved. Their counsellors were calm and practical.',
  },
  {
    id: 'fallback-3',
    author_name: 'Faith A.',
    author_title: 'Studied in Australia',
    rating: 5,
    review_text:
      'The visa support was excellent. I always knew what document was needed next and never felt lost in the process.',
  },
  {
    id: 'fallback-4',
    author_name: 'Kevin O.',
    author_title: 'Studied in Dubai',
    rating: 5,
    review_text:
      'Their pre-departure briefing gave me confidence before travel. I felt prepared before I even boarded the plane.',
  },
]

function formatEventDate(value) {
  if (!value) return 'Date to be announced'

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildHeroStyle(heroSection) {
  const overlayOpacity = Number(heroSection.settings?.overlay_opacity ?? 0.56)
  const clampedOpacity = Number.isFinite(overlayOpacity) ? Math.min(Math.max(overlayOpacity, 0), 0.9) : 0.56

  return {
    '--home-hero-overlay-opacity': clampedOpacity,
  }
}

function Home() {
  const { sections } = usePageSections('home')
  const { settings: siteSettings } = useSiteSettings()
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS)
  const [activeSection, setActiveSection] = useState('hero')
  const [heroMediaReady, setHeroMediaReady] = useState(false)
  const observerRef = useRef(null)

  useEffect(() => {
    let ignore = false

    async function loadHomeData() {
      setEventsLoading(true)

      try {
        const nowIso = new Date().toISOString()
        const [eventsResponse, testimonialsResponse] = await Promise.all([
          supabase
            .from('events')
            .select('id, title, date, location, description, image_url, register_url')
            .gte('date', nowIso)
            .order('date', { ascending: true })
            .limit(6),
          supabase
            .from('testimonials')
            .select('id, author_name, author_title, author_photo_url, rating, review_text')
            .eq('is_published', true)
            .limit(6),
        ])

        if (ignore) return

        if (!eventsResponse.error) {
          setEvents(eventsResponse.data?.length ? eventsResponse.data : UPCOMING_EVENT_FALLBACKS)
        } else {
          setEvents(UPCOMING_EVENT_FALLBACKS)
        }

        if (!testimonialsResponse.error && testimonialsResponse.data?.length) {
          setTestimonials(testimonialsResponse.data)
        } else {
          setTestimonials(FALLBACK_TESTIMONIALS)
        }
      } catch (error) {
        console.error('[Home] Failed to load homepage data:', error)
        if (!ignore) {
          setTestimonials(FALLBACK_TESTIMONIALS)
          setEvents(UPCOMING_EVENT_FALLBACKS)
        }
      } finally {
        if (!ignore) {
          setEventsLoading(false)
        }
      }
    }

    loadHomeData()

    return () => {
      ignore = true
    }
  }, [])

  const sortedSections = useMemo(
    () =>
      Object.entries(sections)
        .filter(([, value]) => value.enabled)
        .sort((a, b) => a[1].order - b[1].order),
    [sections],
  )

  useEffect(() => {
    const nodes = sortedSections
      .map(([key]) => document.getElementById(key))
      .filter(Boolean)

    if (!nodes.length) return undefined

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target?.id) {
          setActiveSection(visible.target.id)
        }
      },
      {
        threshold: [0.2, 0.45, 0.7],
        rootMargin: '-10% 0px -35% 0px',
      },
    )

    nodes.forEach((node) => observerRef.current?.observe(node))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [sortedSections])

  const hero = sections.hero
  const eventsSection = sections.events
  const whySection = sections.why_nexora
  const howItWorks = sections.how_it_works
  const destinationsSection = sections.destinations
  const testimonialsSection = sections.testimonials
  const ctaSection = sections.cta
  const workAbroadSection = getPageSectionDefaults('work_abroad')

  const heroStats = hero.settings?.stats ?? []
  const featureCard = hero.settings?.feature_card ?? {}
  const compactCard = hero.settings?.compact_card ?? {}
  const heroSlides = (hero.settings?.background_images ?? [])
    .map((slide, index) => ({
      image_url: slide.image_url?.trim() || '',
      title: slide.title?.trim() || `Slide ${index + 1}`,
    }))
    .filter((slide) => slide.image_url)
  const fallbackHeroSlides = hero.media_url ? [{ image_url: hero.media_url, title: hero.heading || 'Hero background' }] : []
  const activeHeroSlides = heroSlides.length ? heroSlides : fallbackHeroSlides
  const primaryHeroImage = activeHeroSlides[0]?.image_url?.trim() || ''
  const visibleHeroSlides = heroMediaReady && activeHeroSlides.length
    ? activeHeroSlides
    : HERO_FALLBACK_IMAGES.map((image_url, index) => ({
        image_url,
        title: `Fallback hero background ${index + 1}`,
      }))
  const whyPoints = whySection.items ?? []
  const whyVisualValue = Number(whySection.settings?.visual_badge_value ?? 98)
  const whyVisualSuffix = whySection.settings?.visual_badge_suffix ?? '%'
  const homeDestinations = useMemo(() => mergeDestinationCards(destinationsSection.items ?? []), [destinationsSection.items])
  const featuredWorkJobs = useMemo(() => JOB_CATALOG.filter((job) => job.featured).slice(0, 3), [])
  const homeSteps = howItWorks.items ?? []
  const ctaSecondaryUrl = ctaSection.secondary_btn_url || siteSettings.whatsapp_url || WHATSAPP_URL
  const ctaSecondaryIsExternal = ctaSecondaryUrl.startsWith('http')

  useEffect(() => {
    if (!primaryHeroImage) {
      setHeroMediaReady(false)
      return
    }

    let ignore = false
    const image = new Image()

    setHeroMediaReady(false)

    image.onload = () => {
      if (!ignore) {
        setHeroMediaReady(true)
      }
    }

    image.onerror = () => {
      if (!ignore) {
        setHeroMediaReady(false)
      }
    }

    image.src = primaryHeroImage

    return () => {
      ignore = true
    }
  }, [primaryHeroImage])

  return (
    <div className="home-page">
      <SEO
        title="Study Abroad Consultancy"
        description="Brightpath Travel Scholars helps students access top universities through free consultation, expert application support, and high-success visa guidance."
        path="/"
      />

      <div className="home-section-nav" aria-label="Section navigation">
        {sortedSections.map(([key, section]) => (
          <button
            key={key}
            type="button"
            className={`home-section-dot${activeSection === key ? ' active' : ''}`}
            onClick={() => document.getElementById(key)?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={section.label || section.heading}
            title={section.label || section.heading}
          />
        ))}
      </div>

      <AnimatedSection>
        <section
          id="hero"
          className={`home-hero${visibleHeroSlides.length ? ' has-media' : ''}`}
          style={buildHeroStyle(hero)}
        >
          {visibleHeroSlides.length ? (
            <div className="home-hero-media-stack" aria-hidden="true">
              {visibleHeroSlides.map((slide, index) => (
                <div
                  key={`${slide.title}-${index}`}
                  className={`home-hero-media-layer${visibleHeroSlides.length === 1 ? ' single' : ''}`}
                  style={{
                    backgroundImage: `url(${slide.image_url})`,
                    animationDelay: `${index * 6}s`,
                    animationDuration: `${Math.max(visibleHeroSlides.length * 6, 12)}s`,
                  }}
                />
              ))}
            </div>
          ) : null}
          <div className="container home-hero-grid">
            <div className="home-hero-copy">
              <span className="section-badge home-hero-badge">{hero.badge_text}</span>
              <h1>{hero.heading}</h1>
              <p>{hero.subheading}</p>

              <div className="home-hero-actions">
                <Link to={hero.primary_btn_url} className="btn-primary">
                  {hero.primary_btn_text}
                </Link>
                <Link to={hero.secondary_btn_url} className="home-outline-btn">
                  {hero.secondary_btn_text}
                </Link>
              </div>

              <div className="home-hero-stats">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="home-hero-stat">
                    <AnimatedCount
                      value={Number(stat.value || 0)}
                      suffix={stat.suffix || ''}
                      className="home-stat-number"
                    />
                    <span className="home-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-hero-visual">
              <div className="home-hero-orbit orbit-one" />
              <div className="home-hero-orbit orbit-two" />
              <div className="home-hero-card large">
                <span className="home-card-kicker">{featureCard.kicker}</span>
                <h3>{featureCard.heading}</h3>
                <p>{featureCard.body}</p>
                <div className="home-card-pills">
                  {(featureCard.pills ?? []).map((pill) => (
                    <span key={pill}>{pill}</span>
                  ))}
                </div>
              </div>
              <div className="home-hero-card compact">
                <div className="home-icon-chip">
                  <Star size={18} />
                </div>
                <div>
                  <strong>{compactCard.title}</strong>
                  <p>{compactCard.body}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section id="events" className="home-section home-events">
          <div className="container">
            <div className="home-section-header">
              <div>
                <span className="section-badge">{eventsSection.badge_text}</span>
                <h2>{eventsSection.heading}</h2>
              </div>
              <p>{eventsSection.subheading}</p>
            </div>

            <div className="events-strip">
              {eventsLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <article key={`skeleton-${index}`} className="event-card skeleton">
                      <div className="event-card-image skeleton-block" />
                      <div className="event-card-body">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line" />
                        <div className="skeleton-line small" />
                      </div>
                    </article>
                  ))
                : events.map((event) => (
                    <article key={event.id} className="event-card">
                      <div
                        className="event-card-image"
                        style={{
                          backgroundImage: event.image_url
                            ? `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.3)), url(${event.image_url})`
                            : `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.3)), url(${getEventFallbackImage(event.category, event.is_past)})`,
                        }}
                      />
                      <div className="event-card-body">
                        <span className="event-card-date">
                          <CalendarDays size={15} />
                          {formatEventDate(event.date)}
                        </span>
                        <h3>{event.title}</h3>
                        <p className="event-card-location">
                          <MapPin size={15} />
                          {event.location || 'Location to be confirmed'}
                        </p>
                        <p className="event-card-copy">
                          {event.description || 'Reserve your place and meet the Brightpath team plus partner institutions.'}
                        </p>
                        {event.register_url ? (
                          <a href={event.register_url} target="_blank" rel="noreferrer" className="event-card-action">
                            Register
                          </a>
                        ) : (
                          <Link to="/contact" className="event-card-action">
                            Register
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}

              {!eventsLoading && !events.length ? (
                <article className="event-card event-card-empty">
                  <div className="event-card-body">
                    <h3>Fresh events are on the way</h3>
                    <p>Contact the Brightpath team to hear about upcoming university fairs, webinars, and visa sessions.</p>
                    <Link to="/contact" className="event-card-action">
                      Contact Brightpath
                    </Link>
                  </div>
                </article>
              ) : null}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section id="why_nexora" className="home-section home-why">
          <div className="container home-why-grid">
            <div className="home-why-visual">
                <div
                    className="home-why-panel"
                    style={{
                      background: buildOverlayBackground(
                        whySection.media_url,
                        HERO_FALLBACK_IMAGE,
                        'rgba(91, 44, 137, 0.58)',
                        'rgba(53, 21, 83, 0.36)',
                      ),
                    }}
              >
                <div className="home-why-badge">
                  <AnimatedCount value={whyVisualValue} suffix={whyVisualSuffix} className="home-why-badge-number" />
                  <span>{whySection.settings?.visual_badge_label}</span>
                </div>
                <div className="home-why-visual-copy">
                  <span>Student-first guidance</span>
                  <h3>{whySection.settings?.visual_heading}</h3>
                  <p>{whySection.settings?.visual_body}</p>
                </div>
              </div>
            </div>

            <div className="home-why-copy">
              <span className="section-badge">{whySection.badge_text}</span>
              <h2>{whySection.heading}</h2>
              <p>{whySection.subheading}</p>

              <div className="home-why-list">
                {whyPoints.map((point) => (
                  <div key={point.text} className="home-why-item">
                    <CheckCircle2 size={18} />
                    <span>{point.text}</span>
                  </div>
                ))}
              </div>

              <Link to={whySection.settings?.link_url || '/about'} className="home-inline-link">
                {whySection.settings?.link_text || 'Learn More'}
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section id="how_it_works" className="home-section home-steps">
          <div className="container">
            <div className="home-section-header centered">
              <span className="section-badge">{howItWorks.badge_text}</span>
              <h2>{howItWorks.heading}</h2>
              <p>{howItWorks.subheading}</p>
            </div>

            <div className="steps-grid">
              {homeSteps.map((step, index) => {
                const Icon = STEP_ICONS[index] || STEP_ICONS[STEP_ICONS.length - 1]

                return (
                  <article key={step.title} className="step-card">
                    <div className="step-card-top">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-icon">
                        <Icon size={18} />
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <section id="destinations" className="home-section home-destinations">
          <div className="container">
            <div className="home-section-header">
              <div>
                <span className="section-badge">{destinationsSection.badge_text}</span>
                <h2>{destinationsSection.heading}</h2>
              </div>
              <p>{destinationsSection.subheading}</p>
            </div>

            <div className="destinations-grid">
              {homeDestinations.map((destination) => (
                <article
                  key={destination.slug}
                  className={`destination-card${(destination.image_url || getDestinationFallbackImage(destination.slug)) ? ' has-image' : ''}`}
                  style={{
                    background: `linear-gradient(rgba(91, 44, 137, 0.38), rgba(53, 21, 83, 0.58)), url(${destination.image_url || getDestinationFallbackImage(destination.slug)}) center/cover`,
                  }}
                >
                  <span className="destination-flag">{destination.code}</span>
                  <div className="destination-copy">
                    <h3>{destination.name}</h3>
                    <p>{destination.subtitle}</p>
                  </div>
                  <Link to={`/study-abroad/${destination.slug}`} className="destination-link">
                    Explore
                    <ChevronRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.22}>
        <section id="work_abroad" className="home-section home-work">
          <div className="container">
            <div className="home-section-header">
              <div>
                <span className="section-badge">{workAbroadSection.hero.badge_text}</span>
                <h2>{workAbroadSection.hero.heading}</h2>
              </div>
              <Link to={workAbroadSection.hero.primary_btn_url || '/work-abroad'} className="btn-secondary home-work-link">
                {workAbroadSection.hero.primary_btn_text || 'View All Jobs'}
              </Link>
            </div>

            <div className="home-work-grid">
              {featuredWorkJobs.map((job) => {
                const imageUrl = `https://source.unsplash.com/featured/800x500/?${encodeURIComponent(job.imageKeyword)}`

                return (
                  <article key={job.id} className="home-work-card">
                    <div
                      className="home-work-image"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(53, 21, 83, 0.08) 0%, rgba(53, 21, 83, 0.58) 100%), url(${imageUrl})`,
                      }}
                    >
                      <span className="home-work-country-pill">
                        {job.flag} {job.country}
                      </span>
                      <span className={`home-work-type-pill ${job.type}`}>
                        {job.type === 'skilled' ? 'Skilled' : 'Unskilled'}
                      </span>
                    </div>

                    <div className="home-work-body">
                      <div className="home-work-head">
                        <div>
                          <p className="home-work-region">
                            <MapPin size={14} />
                            {job.region}
                          </p>
                          <h3>{job.title}</h3>
                          <p className="home-work-employer">
                            <Briefcase size={14} />
                            {job.employer}
                          </p>
                        </div>
                        <span className="home-work-salary">{job.salary}</span>
                      </div>

                      <div className="home-work-highlights">
                        <span>
                          <ShieldCheck size={14} />
                          {job.visaSponsorship ? 'Visa sponsorship' : 'No sponsorship'}
                        </span>
                        <span>
                          <Warehouse size={14} />
                          {job.accommodationProvided ? 'Accommodation' : 'Self-arranged stay'}
                        </span>
                        <span>
                          <Users size={14} />
                          {job.positions} openings
                        </span>
                      </div>

                      <div className="home-work-meta">
                        <span>
                          <CalendarDays size={14} />
                          Deadline {formatEventDate(job.deadline)}
                        </span>
                        <span className={`home-work-status ${job.status}`}>{job.status.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="home-work-actions">
                        <Link to={buildJobDetailPath(job.id)} className="btn-secondary home-work-secondary">
                          View Job
                        </Link>
                        <Link to={buildJobApplyPath(job.id)} className="btn-primary home-work-primary">
                          Apply Now
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.24}>
        <section id="testimonials" className="home-section home-testimonials">
          <div className="container">
            <div className="home-section-header">
              <div>
                <span className="section-badge">{testimonialsSection.badge_text}</span>
                <h2>{testimonialsSection.heading}</h2>
              </div>
              <p>{testimonialsSection.subheading}</p>
            </div>

            <div className="testimonials-grid">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id} className="testimonial-card">
                  <div className="testimonial-stars">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, index) => (
                      <Star key={`${testimonial.id}-${index}`} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="testimonial-quote">"{testimonial.review_text}"</p>
                  <div className="testimonial-author">
                    <span className="testimonial-avatar">
                      {testimonial.author_name?.charAt(0)?.toUpperCase() || 'N'}
                    </span>
                    <div>
                      <strong>{testimonial.author_name || 'Brightpath Student'}</strong>
                      <span>{testimonial.author_title || 'Study abroad student'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.28}>
        <section id="cta" className="home-section home-cta">
          <div className="container">
            <div className="home-cta-panel">
              <div>
                <span className="section-badge">{ctaSection.badge_text}</span>
                <h2>{ctaSection.heading}</h2>
                <p>{ctaSection.subheading}</p>
              </div>

              <div className="home-cta-actions">
                <Link to={ctaSection.primary_btn_url} className="btn-primary">
                  {ctaSection.primary_btn_text}
                </Link>
                {ctaSecondaryIsExternal ? (
                  <a href={ctaSecondaryUrl} target="_blank" rel="noreferrer" className="home-whatsapp-btn">
                    {ctaSection.secondary_btn_text || 'WhatsApp Us'}
                  </a>
                ) : (
                  <Link to={ctaSecondaryUrl} className="home-whatsapp-btn">
                    {ctaSection.secondary_btn_text || 'Learn More'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Home
