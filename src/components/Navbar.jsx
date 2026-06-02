import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { SITE_NAME } from '../lib/siteConfig'

const destinationLinks = [
  { to: '/study-abroad/uk', label: 'UK' },
  { to: '/study-abroad/australia', label: 'Australia' },
  { to: '/study-abroad/canada', label: 'Canada' },
  { to: '/study-abroad/usa', label: 'USA' },
  { to: '/study-abroad/new-zealand', label: 'New Zealand' },
  { to: '/study-abroad/dubai', label: 'Dubai' },
  { to: '/study-abroad/europe', label: 'Europe' },
  { to: '/study-abroad/malaysia', label: 'Malaysia' },
  { to: '/study-abroad/turkey', label: 'Turkey' },
  { to: '/study-abroad/china', label: 'China' },
]

const primaryLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/community', label: 'Community' },
  { to: '/contact', label: 'Contact' },
]

function Navbar() {
  const { user, profile, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const navInteractiveRef = useRef(null)

  const displayName = useMemo(() => {
    if (profile?.full_name?.trim()) return profile.full_name.trim()
    if (user?.user_metadata?.full_name?.trim()) return user.user_metadata.full_name.trim()
    return user?.email?.split('@')[0] || 'Student'
  }, [profile?.full_name, user?.email, user?.user_metadata?.full_name])

  const avatarInitial = displayName.charAt(0).toUpperCase()
  const isStudyActive = location.pathname.startsWith('/study-abroad')
  const isActive = (path) => location.pathname === path

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 18)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setStudyOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }

      if (
        (studyOpen || userMenuOpen) &&
        navInteractiveRef.current &&
        !navInteractiveRef.current.contains(event.target)
      ) {
        setStudyOpen(false)
        setUserMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setStudyOpen(false)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, studyOpen, userMenuOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <header className={`nexora-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="container nexora-nav-inner">
          <Link to="/" className="nexora-logo" aria-label={`${SITE_NAME} home`}>
            <img src="/favicon.ico" alt="" aria-hidden="true" className="nexora-logo-image" />
            <span className="nexora-logo-text">{SITE_NAME}</span>
          </Link>

          <div className="nexora-nav-desktop" ref={navInteractiveRef}>
            <nav className="nexora-nav-center" aria-label="Primary">
              {primaryLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nexora-nav-link${isActive(link.to) ? ' active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}

              <div
                className="nexora-nav-dropdown-wrap"
                onMouseEnter={() => setStudyOpen(true)}
                onMouseLeave={() => setStudyOpen(false)}
              >
                <button
                  type="button"
                  className={`nexora-nav-dropdown-trigger${isStudyActive ? ' active' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={studyOpen}
                  onClick={() => {
                    setUserMenuOpen(false)
                    setStudyOpen((current) => !current)
                  }}
                >
                  <span>Study Abroad</span>
                  <ChevronDown size={16} className={studyOpen ? 'rotate' : ''} />
                </button>

                {studyOpen ? (
                  <div className="nexora-dropdown-panel" role="menu" aria-label="Study abroad destinations">
                    {destinationLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        role="menuitem"
                        className="nexora-dropdown-link"
                        onClick={() => setStudyOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="nexora-nav-actions">
              <Link to="/contact" className="nexora-consult-btn">
                Book Free Consultation
              </Link>

              {user ? (
                <div className="nexora-user-wrap">
                  <button
                    type="button"
                    className={`nexora-user-trigger${userMenuOpen ? ' open' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    onClick={() => {
                      setStudyOpen(false)
                      setUserMenuOpen((current) => !current)
                    }}
                  >
                    <span className="nexora-user-avatar">{avatarInitial}</span>
                    <span className="nexora-user-name">{displayName}</span>
                    <ChevronDown size={16} className={userMenuOpen ? 'rotate' : ''} />
                  </button>

                  {userMenuOpen ? (
                    <div className="nexora-dropdown-panel nexora-user-panel" role="menu" aria-label="User menu">
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          role="menuitem"
                          className="nexora-dropdown-link"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      ) : null}
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        className="nexora-dropdown-link"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="nexora-dropdown-link nexora-danger-link"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="nexora-auth-actions">
                  <Link to="/login" className="nexora-signin-link">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary nexora-register-btn">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="nexora-mobile-actions">
            <Link to="/contact" className="nexora-consult-btn mobile">
              Book Free Consultation
            </Link>
            <button
              type="button"
              className={`nexora-menu-toggle${menuOpen ? ' open' : ''}`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="nexora-mobile-drawer"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <Menu size={22} className="menu-icon open-icon" />
              <X size={22} className="menu-icon close-icon" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? <div className="nexora-mobile-overlay" /> : null}

      <aside
        ref={drawerRef}
        id="nexora-mobile-drawer"
        className={`nexora-mobile-drawer${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="nexora-mobile-header">
          <Link to="/" className="nexora-logo" aria-label={`${SITE_NAME} home`}>
            <img src="/favicon.ico" alt="" aria-hidden="true" className="nexora-logo-image" />
            <span className="nexora-logo-text">{SITE_NAME}</span>
          </Link>
          <button
            type="button"
            className="nexora-drawer-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nexora-mobile-links" aria-label="Mobile">
          {primaryLinks.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? 'active' : ''}>
              {link.label}
            </Link>
          ))}

          <div className="nexora-mobile-group">
            <button
              type="button"
              className={`nexora-mobile-group-trigger${studyOpen ? ' open' : ''}${isStudyActive ? ' active' : ''}`}
              aria-expanded={studyOpen}
              onClick={() => setStudyOpen((current) => !current)}
            >
              <span>Study Abroad</span>
              <ChevronDown size={16} className={studyOpen ? ' rotate' : ''} />
            </button>

            {studyOpen ? (
              <div className="nexora-mobile-subgroup">
                {destinationLinks.map((link) => (
                  <Link key={link.to} to={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="nexora-mobile-auth">
          <Link to="/contact" className="nexora-consult-btn full">
            Book Free Consultation
          </Link>

          {user ? (
            <>
              <div className="nexora-mobile-user">
                <span className="nexora-user-avatar">{avatarInitial}</span>
                <div>
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <Link to="/dashboard" className="btn-secondary">
                Dashboard
              </Link>
              {isAdmin ? (
                <Link to="/admin" className="btn-secondary">
                  Admin Dashboard
                </Link>
              ) : null}
              <button type="button" className="btn-secondary nexora-mobile-signout" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <div className="nexora-mobile-auth-links">
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .nexora-nav {
          position: fixed;
          inset: 0 0 auto;
          z-index: 1200;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid rgba(10, 31, 68, 0.05);
          transition: box-shadow 0.22s ease, background 0.22s ease;
        }

        .nexora-nav.scrolled {
          box-shadow: 0 12px 34px rgba(10, 31, 68, 0.12);
          background: rgba(255, 255, 255, 0.98);
        }

        .nexora-nav-inner {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .nexora-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          min-width: 0;
        }

        .nexora-logo-image {
          width: 2.45rem;
          height: 2.45rem;
          display: block;
          border-radius: 999px;
          background: var(--white);
          object-fit: cover;
          box-shadow: 0 8px 20px rgba(91, 44, 137, 0.16);
        }

        .nexora-logo-text {
          max-width: 16rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--navy);
          font-size: 1.12rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .nexora-nav-desktop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
          gap: 1.5rem;
        }

        .nexora-nav-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          flex: 1;
        }

        .nexora-nav-link,
        .nexora-nav-dropdown-trigger,
        .nexora-signin-link {
          color: rgba(10, 31, 68, 0.78);
          font-size: 0.95rem;
          font-weight: 700;
          transition: color 0.2s ease;
        }

        .nexora-nav-link:hover,
        .nexora-nav-link.active,
        .nexora-nav-dropdown-trigger:hover,
        .nexora-nav-dropdown-trigger.active,
        .nexora-signin-link:hover {
          color: var(--gold-dark);
        }

        .nexora-nav-dropdown-wrap {
          position: relative;
        }

        .nexora-nav-dropdown-trigger,
        .nexora-user-trigger,
        .nexora-menu-toggle,
        .nexora-drawer-close {
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .nexora-nav-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 42px;
        }

        .nexora-dropdown-panel {
          position: absolute;
          top: calc(100% + 0.9rem);
          left: 0;
          min-width: 220px;
          padding: 0.55rem;
          display: grid;
          gap: 0.2rem;
          background: var(--white);
          border: 1px solid rgba(10, 31, 68, 0.1);
          border-radius: 1.2rem;
          box-shadow: 0 24px 50px rgba(10, 31, 68, 0.16);
        }

        .nexora-dropdown-link {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 46px;
          padding: 0.7rem 0.9rem;
          border-radius: 0.9rem;
          color: rgba(10, 31, 68, 0.86);
          font-size: 0.92rem;
          font-weight: 700;
          transition: background 0.18s ease, color 0.18s ease;
          text-align: left;
        }

        .nexora-dropdown-link:hover {
          background: rgba(212, 175, 55, 0.12);
          color: var(--navy);
        }

        .nexora-user-panel {
          right: 0;
          left: auto;
          min-width: 200px;
        }

        .nexora-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-shrink: 0;
        }

        .nexora-consult-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.72rem 1.15rem;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold) 0%, #e5c35f 100%);
          color: var(--navy);
          font-size: 0.88rem;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 12px 24px rgba(212, 175, 55, 0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .nexora-consult-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(212, 175, 55, 0.32);
        }

        .nexora-auth-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .nexora-register-btn {
          padding-inline: 1.3rem;
          font-size: 0.9rem;
        }

        .nexora-user-wrap {
          position: relative;
        }

        .nexora-user-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          min-height: 44px;
          padding: 0.35rem 0.55rem 0.35rem 0.4rem;
          border-radius: 999px;
          border: 1px solid rgba(10, 31, 68, 0.1);
          background: rgba(255, 255, 255, 0.92);
          color: var(--navy);
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .nexora-user-trigger:hover,
        .nexora-user-trigger.open {
          border-color: rgba(212, 175, 55, 0.55);
          background: rgba(212, 175, 55, 0.08);
        }

        .nexora-user-avatar {
          width: 2rem;
          height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--navy);
          color: var(--gold);
          font-size: 0.82rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .nexora-user-name {
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.92rem;
          font-weight: 700;
        }

        .nexora-danger-link {
          color: #b42318;
        }

        .nexora-danger-link:hover {
          background: rgba(180, 35, 24, 0.08);
          color: #8e1c11;
        }

        .rotate {
          transform: rotate(180deg);
          transition: transform 0.2s ease;
        }

        .nexora-mobile-actions {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
          flex-shrink: 0;
        }

        .nexora-menu-toggle {
          position: relative;
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.95rem;
          color: var(--navy);
          background: rgba(10, 31, 68, 0.04);
          transition: background 0.2s ease;
        }

        .nexora-menu-toggle:hover {
          background: rgba(10, 31, 68, 0.08);
        }

        .menu-icon {
          position: absolute;
          transition: transform 0.22s ease, opacity 0.22s ease;
        }

        .open-icon {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        .close-icon {
          opacity: 0;
          transform: rotate(-90deg) scale(0.7);
        }

        .nexora-menu-toggle.open .open-icon {
          opacity: 0;
          transform: rotate(90deg) scale(0.7);
        }

        .nexora-menu-toggle.open .close-icon {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        .nexora-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 1190;
          background: rgba(7, 17, 38, 0.42);
        }

        .nexora-mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 1201;
          width: min(360px, 88vw);
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
          box-shadow: -18px 0 44px rgba(10, 31, 68, 0.18);
          transform: translateX(100%);
          transition: transform 0.28s ease;
          overflow-y: auto;
        }

        .nexora-mobile-drawer.open {
          transform: translateX(0);
        }

        .nexora-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.2rem 1.2rem 1rem;
          border-bottom: 1px solid rgba(10, 31, 68, 0.08);
        }

        .nexora-drawer-close {
          width: 2.3rem;
          height: 2.3rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.85rem;
          color: var(--navy);
          background: rgba(10, 31, 68, 0.05);
        }

        .nexora-mobile-links {
          display: grid;
          gap: 0.2rem;
          padding: 1rem 1rem 0.3rem;
        }

        .nexora-mobile-links > a,
        .nexora-mobile-group-trigger,
        .nexora-mobile-subgroup a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: 1rem;
          color: rgba(10, 31, 68, 0.88);
          font-size: 0.98rem;
          font-weight: 700;
          transition: background 0.18s ease, color 0.18s ease;
          text-align: left;
        }

        .nexora-mobile-links > a:hover,
        .nexora-mobile-links > a.active,
        .nexora-mobile-group-trigger:hover,
        .nexora-mobile-group-trigger.active,
        .nexora-mobile-subgroup a:hover {
          background: rgba(212, 175, 55, 0.12);
          color: var(--navy);
        }

        .nexora-mobile-subgroup {
          display: grid;
          gap: 0.2rem;
          padding-top: 0.3rem;
        }

        .nexora-mobile-subgroup a {
          padding-left: 1.35rem;
          font-size: 0.93rem;
          color: rgba(10, 31, 68, 0.75);
        }

        .nexora-mobile-auth {
          margin-top: auto;
          display: grid;
          gap: 0.9rem;
          padding: 1.2rem;
          border-top: 1px solid rgba(10, 31, 68, 0.08);
          background: rgba(255, 255, 255, 0.82);
        }

        .nexora-consult-btn.full,
        .nexora-mobile-auth-links .btn-primary,
        .nexora-mobile-auth-links .btn-secondary,
        .nexora-mobile-auth .btn-secondary {
          width: 100%;
        }

        .nexora-mobile-user {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
          border-radius: 1rem;
          background: rgba(10, 31, 68, 0.05);
        }

        .nexora-mobile-user strong {
          display: block;
          color: var(--navy);
          font-size: 0.94rem;
        }

        .nexora-mobile-user span:last-child {
          color: rgba(10, 31, 68, 0.62);
          font-size: 0.82rem;
        }

        .nexora-mobile-auth-links {
          display: grid;
          gap: 0.85rem;
        }

        .nexora-mobile-signout {
          color: #8e1c11;
          border-color: rgba(180, 35, 24, 0.25);
        }

        .nexora-mobile-signout:hover {
          background: rgba(180, 35, 24, 0.08);
          color: #8e1c11;
        }

        @media (max-width: 1120px) {
          .nexora-nav-center {
            gap: 0.95rem;
          }

          .nexora-logo-text {
            max-width: 13rem;
            font-size: 1rem;
          }

          .nexora-consult-btn {
            padding-inline: 1rem;
          }

          .nexora-user-name {
            max-width: 92px;
          }
        }

        @media (max-width: 920px) {
          .nexora-nav-desktop {
            display: none;
          }

          .nexora-mobile-actions {
            display: flex;
          }
        }

        @media (max-width: 640px) {
          .nexora-nav-inner {
            min-height: 80px;
            gap: 0.5rem;
          }

          .nexora-logo-image {
            width: 2.2rem;
            height: 2.2rem;
          }

          .nexora-logo-text {
            max-width: 10rem;
            font-size: 0.96rem;
          }

          .nexora-mobile-actions {
            gap: 0.5rem;
          }

          .nexora-consult-btn.mobile {
            display: none;
          }
        }
      `}</style>
    </>
  )
}

export default Navbar
