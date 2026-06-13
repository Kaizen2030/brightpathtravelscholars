import { useEffect, useMemo, useState } from 'react'
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Twitter, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { supabase } from '../lib/supabaseClient'
import './Contact.css'

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
}

function Contact() {
  const { sections } = usePageSections('contact')
  const { settings: siteSettings } = useSiteSettings()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const hero = sections.hero
  const infoCards = sections.info_cards
  const formSection = sections.form
  const sidebar = sections.sidebar
  const cta = sections.cta
  const fallbackSocials = useMemo(
    () =>
      [
        { label: 'Facebook', url: siteSettings.facebook_url },
        { label: 'Instagram', url: siteSettings.instagram_url },
        { label: 'X', url: siteSettings.x_url },
        { label: 'YouTube', url: siteSettings.youtube_url },
        { label: 'LinkedIn', url: siteSettings.linkedin_url },
      ].filter((social) => social.url),
    [siteSettings],
  )
  const subjectOptions = useMemo(
    () => formSection.settings?.subject_options ?? ['General Inquiry'],
    [formSection.settings],
  )

  useEffect(() => {
    setForm((current) => ({
      ...current,
      subject: current.subject || subjectOptions[0] || 'General Inquiry',
    }))
  }, [subjectOptions])

  useEffect(() => {
    if (!toast) return undefined

    const timerId = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timerId)
  }, [toast])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
      }

      const { error } = await supabase.from('contact_messages').insert(payload)

      if (error) throw error

      setForm({
        full_name: '',
        email: '',
        phone: '',
        subject: subjectOptions[0] || 'General Inquiry',
        message: '',
      })
      setToast({
        type: 'success',
        message: formSection.settings?.success_message || 'Your message has been sent. We will get back to you shortly.',
      })
    } catch (error) {
      console.error('[Contact] Failed to send message:', error)
      setToast({
        type: 'error',
        message:
          formSection.settings?.error_message || 'We could not send your message right now. Please try again in a moment.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="contact-page">
      <SEO
        title="Contact Brightpath Travel Scholars"
        description="Contact Brightpath Travel Scholars to book a consultation, ask about destinations, or get help with your study abroad plan."
        path="/contact"
      />

      {toast ? (
        <div className={`contact-toast ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}

      <section className="contact-hero">
        <div className="container">
          <span className="section-badge contact-hero-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>
        </div>
      </section>

      <AnimatedSection>
        <section className="contact-section">
          <div className="container">
            <div className="contact-cards-grid">
              {(infoCards.items ?? []).map((card, index) => (
                <article key={`${card.title}-${index}`} className="contact-info-card">
                  <span className="contact-info-icon">
                    {index === 0 ? <MapPin size={20} /> : index === 1 ? <Phone size={20} /> : <Mail size={20} />}
                  </span>
                  <h2>{card.title}</h2>
                  <p>{card.value}</p>
                  {card.url ? (
                    <a href={card.url} target="_blank" rel="noreferrer" className="contact-whatsapp-btn">
                      {card.description}
                    </a>
                  ) : (
                    <span>{card.description}</span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="contact-section alt">
          <div className="container contact-main-grid">
            <div className="contact-form-panel">
              <span className="section-badge">{formSection.badge_text}</span>
              <h2>{formSection.heading}</h2>
              <p>{formSection.subheading}</p>

              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-grid">
                  <label>
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(event) => updateField('full_name', event.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label>
                    <span>Phone</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      placeholder="+1..."
                      required
                    />
                  </label>

                  <label>
                    <span>Subject</span>
                    <select
                      value={form.subject}
                      onChange={(event) => updateField('subject', event.target.value)}
                    >
                      {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Message</span>
                  <textarea
                    rows="6"
                    value={form.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    placeholder={formSection.settings?.message_placeholder || 'Tell us about the destination, course, or support you need...'}
                    required
                  />
                </label>

                <button type="submit" className="btn-primary contact-submit-btn" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? 'Sending...' : formSection.settings?.submit_text || 'Submit'}
                </button>
              </form>
            </div>

            <div className="contact-sidebar">
              <div className="contact-map-card">
                {(() => {
                  const location = (siteSettings.office_location || sidebar.settings?.map_body || '').trim()
                  const mapQuery = encodeURIComponent(location || 'Jacksonville, GA 31544, USA')
                  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`

                  return (
                    <div className="contact-map-embed">
                      <iframe
                        title="Brightpath Office Location"
                        src={mapSrc}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ border: 0, borderRadius: '12px', minHeight: '17rem' }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <strong>{sidebar.settings?.map_title || 'U.S. Office'}</strong>
                        <p>{location}</p>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="contact-side-card">
                <h3>{sidebar.settings?.hours_title}</h3>
                {(sidebar.settings?.hours ?? []).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="contact-side-card">
                <h3>{sidebar.settings?.socials_title}</h3>
                <div className="contact-socials">
                  {(sidebar.settings?.socials?.length ? sidebar.settings.socials : fallbackSocials).map((social) => {
                    const Icon = SOCIAL_ICONS[social.label?.toLowerCase()] || Facebook

                    return (
                      <a key={social.label} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}>
                        <Icon size={18} />
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="contact-section contact-cta-section">
          <div className="container">
            <div className="contact-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>
              <div className="contact-cta-actions">
                <Link to={cta.primary_btn_url} className="btn-primary">
                  {cta.primary_btn_text}
                </Link>
                <a href={cta.secondary_btn_url} target="_blank" rel="noreferrer" className="btn-secondary contact-cta-secondary">
                  {cta.secondary_btn_text}
                </a>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Contact
