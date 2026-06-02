import { Clock3, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SITE_NAME, SITE_TAGLINE } from '../lib/siteConfig'
import { useSiteSettings } from '../hooks/useSiteSettings'

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/community', label: 'Community' },
  { to: '/study-abroad', label: 'Study Abroad' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
  { to: '/apply', label: 'Apply Now' },
]

function Footer() {
  const { settings } = useSiteSettings()

  const socialLinks = useMemo(
    () =>
      [
        { href: settings.facebook_url, label: 'Facebook', icon: Facebook },
        { href: settings.instagram_url, label: 'Instagram', icon: Instagram },
        { href: settings.x_url, label: 'X', icon: Twitter },
        { href: settings.youtube_url, label: 'YouTube', icon: Youtube },
        { href: settings.linkedin_url, label: 'LinkedIn', icon: Linkedin },
      ].filter((item) => item.href),
    [settings],
  )

  const contactItems = useMemo(
    () => [
      { icon: MapPin, label: 'United States' },
      {
        icon: Mail,
        label: settings.contact_email || 'info@brightpathtravelscholars.com',
        href: `mailto:${settings.contact_email || 'info@brightpathtravelscholars.com'}`,
      },
      {
        icon: Phone,
        label: settings.contact_phone || '+254 734 004 003',
        href: settings.whatsapp_url || 'https://wa.me/254734004003',
      },
      { icon: Clock3, label: 'Mon-Fri 8:30AM-5PM, Sat 8:30AM-3PM' },
    ],
    [settings],
  )

  const siteName = settings.site_name || SITE_NAME
  const siteTagline = settings.site_tagline || SITE_TAGLINE

  return (
    <>
      <footer className="nexora-footer">
        <div className="container nexora-footer-inner">
          <div className="nexora-footer-grid">
            <div className="nexora-footer-brand">
              <h3>{siteName}</h3>
              <p className="nexora-footer-tagline">{siteTagline}</p>
              <p className="nexora-footer-description">
                A USA-based study abroad consultancy connecting students to 400+ universities worldwide.
              </p>
            </div>

            <div className="nexora-footer-links-col">
              <h4>Quick Links</h4>
              <nav className="nexora-footer-links" aria-label="Quick links">
                {quickLinks.map((link) => (
                  <Link key={link.to} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="nexora-footer-contact">
              <h4>Contact Info</h4>
              <div className="nexora-contact-list">
                {contactItems.map((item) => {
                  const Icon = item.icon
                  const content = (
                    <div key={item.label} className="nexora-contact-item">
                      <span className="nexora-contact-icon">
                        <Icon size={18} />
                      </span>
                      <span>{item.label}</span>
                    </div>
                  )

                  if (item.href) {
                    return (
                      <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="nexora-contact-item">
                        <span className="nexora-contact-icon">
                          <Icon size={18} />
                        </span>
                        <span>{item.label}</span>
                      </a>
                    )
                  }

                  return content
                })}
              </div>
            </div>
          </div>

          <div className="nexora-footer-bottom">
            <div className="nexora-socials" aria-label="Social media">
              {socialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                  </a>
                )
              })}
            </div>
            <p>&copy; 2030 {siteName}. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .nexora-footer {
          background:
            radial-gradient(circle at top right, rgba(212, 175, 55, 0.18), transparent 24%),
            linear-gradient(180deg, #5b2c89 0%, #2f1346 100%);
          color: rgba(255, 255, 255, 0.9);
        }

        .nexora-footer-inner {
          padding-top: 4.5rem;
          padding-bottom: 1.5rem;
        }

        .nexora-footer-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.85fr 1fr;
          gap: 2rem;
        }

        .nexora-footer-brand h3,
        .nexora-footer-links-col h4,
        .nexora-footer-contact h4 {
          color: var(--white);
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .nexora-footer-tagline {
          color: var(--gold);
          font-weight: 700;
          margin-bottom: 0.85rem;
        }

        .nexora-footer-description {
          max-width: 34rem;
          color: rgba(255, 255, 255, 0.76);
          line-height: 1.75;
        }

        .nexora-footer-links {
          display: grid;
          gap: 0.8rem;
        }

        .nexora-footer-links a,
        .nexora-contact-item {
          color: rgba(255, 255, 255, 0.78);
          text-decoration: none;
          transition: color 0.18s ease, transform 0.18s ease;
        }

        .nexora-footer-links a:hover,
        .nexora-contact-item:hover {
          color: var(--gold);
          transform: translateX(2px);
        }

        .nexora-contact-list {
          display: grid;
          gap: 0.95rem;
        }

        .nexora-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          line-height: 1.6;
        }

        .nexora-contact-icon {
          width: 2rem;
          height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.16);
          color: var(--gold);
          flex-shrink: 0;
        }

        .nexora-footer-bottom {
          margin-top: 2.5rem;
          padding-top: 1.35rem;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .nexora-footer-bottom p {
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.94rem;
        }

        .nexora-socials {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }

        .nexora-socials a {
          width: 2.5rem;
          height: 2.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: var(--white);
          background: rgba(255, 255, 255, 0.04);
          transition: transform 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }

        .nexora-socials a:hover {
          transform: translateY(-2px);
          color: var(--gold);
          border-color: rgba(212, 175, 55, 0.45);
        }

        @media (max-width: 900px) {
          .nexora-footer-grid {
            grid-template-columns: 1fr;
          }

          .nexora-footer-description {
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .nexora-footer-inner {
            padding-top: 3.75rem;
          }

          .nexora-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  )
}

export default Footer
