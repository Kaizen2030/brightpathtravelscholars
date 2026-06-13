import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, BookOpen, Globe, Lightbulb, Star, Users } from 'lucide-react'
import AnimatedCount from '../components/AnimatedCount'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { HERO_FALLBACK_IMAGE, STUDY_GROUP_FALLBACK_IMAGE } from '../lib/fallbackImages'
import { buildOverlayBackground } from '../lib/mediaStyles'
import { supabase } from '../lib/supabaseClient'
import './About.css'

const VALUE_ICONS = [Star, Award, BookOpen, Lightbulb, Users, Globe]

import FALLBACK_TEAM from '../lib/fallbackTeam'

function About() {
  const { sections } = usePageSections('about')
  const [teamMembers, setTeamMembers] = useState(FALLBACK_TEAM)
  const [teamLoading, setTeamLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadTeamMembers() {
      setTeamLoading(true)

      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('id, name, role, bio, photo_url, order_index')
          .order('order_index', { ascending: true })

        if (ignore) return

        if (!error && data?.length) {
          setTeamMembers(data)
        }
      } catch (error) {
        console.error('[About] Failed to load team members:', error)
      } finally {
        if (!ignore) {
          setTeamLoading(false)
        }
      }
    }

    loadTeamMembers()

    return () => {
      ignore = true
    }
  }, [])

  const hero = sections.hero
  const story = sections.story
  const missionVision = sections.mission_vision
  const values = sections.values
  const team = sections.team
  const stats = sections.stats
  const cta = sections.cta
  const statItems = stats.settings?.stats ?? []

  return (
    <div className="about-page">
      <SEO
        title="About Brightpath Travel Scholars"
        description="Learn about Brightpath Travel Scholars, our student-first study abroad mission, our U.S.-based counselling team, and the values behind our support."
        path="/about"
      />

      <section
        className="about-hero"
        style={{
          background: buildOverlayBackground(hero.media_url, HERO_FALLBACK_IMAGE, 'rgba(91, 44, 137, 0.72)', 'rgba(53, 21, 83, 0.38)'),
        }}
      >
        <div className="container">
          <div className="about-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>About</span>
          </div>
          <div className="about-hero-copy">
            <span className="section-badge about-hero-badge">{hero.badge_text}</span>
            <h1>{hero.heading}</h1>
            <p>{hero.subheading}</p>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="about-section about-story">
          <div className="container about-story-grid">
            <div className="about-story-visual">
              <div
                className="about-story-panel"
                style={{
                  background: buildOverlayBackground(
                    story.media_url,
                    STUDY_GROUP_FALLBACK_IMAGE,
                    'rgba(13, 31, 69, 0.72)',
                    'rgba(28, 64, 124, 0.44)',
                  ),
                }}
              >
                <span className="about-story-tag">{story.settings?.visual_tag}</span>
                <h3>{story.settings?.visual_heading}</h3>
                <p>{story.settings?.visual_body}</p>
              </div>
            </div>

            <div className="about-story-copy">
              <span className="section-badge">{story.badge_text}</span>
              <h2>{story.heading}</h2>
              <p>{story.subheading}</p>
              <p>{story.body_text}</p>
              <div className="about-story-points">
                {(story.items ?? []).map((item) => (
                  <div key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="about-section about-purpose">
          <div className="container about-purpose-grid">
            <article className="about-purpose-card mission">
              <span className="section-badge inverted">{missionVision.settings?.mission?.badge || 'Mission'}</span>
              <h2>{missionVision.settings?.mission?.heading}</h2>
              <p>{missionVision.settings?.mission?.body}</p>
            </article>

            <article className="about-purpose-card vision">
              <span className="section-badge gold">{missionVision.settings?.vision?.badge || 'Vision'}</span>
              <h2>{missionVision.settings?.vision?.heading}</h2>
              <p>{missionVision.settings?.vision?.body}</p>
            </article>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="about-section about-values">
          <div className="container">
            <div className="about-section-header">
              <span className="section-badge">{values.badge_text}</span>
              <h2>{values.heading}</h2>
              <p>{values.subheading}</p>
            </div>

            <div className="about-values-grid">
              {(values.items ?? []).map((value, index) => {
                const Icon = VALUE_ICONS[index] || Globe

                return (
                  <article key={value.title} className="about-value-card">
                    <span className="about-value-icon">
                      <Icon size={20} />
                    </span>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section className="about-section about-team">
          <div className="container">
            <div className="about-section-header">
              <span className="section-badge">{team.badge_text}</span>
              <h2>{team.heading}</h2>
              <p>{team.subheading}</p>
            </div>

            <div className="about-team-grid">
              {(teamLoading ? FALLBACK_TEAM : teamMembers).map((member) => (
                <article key={member.id} className="about-team-card">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="about-team-photo" />
                  ) : (
                    <div className="about-team-avatar">
                      {member.name
                        ?.split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'NE'}
                    </div>
                  )}
                  <h3>{member.name}</h3>
                  <span>{member.role}</span>
                  <p>{member.bio}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <section className="about-section about-stats">
          <div className="container">
            <div className="about-stats-bar">
              {statItems.map((stat) => (
                <div key={stat.label} className="about-stat-card">
                  <AnimatedCount value={Number(stat.value || 0)} suffix={stat.suffix || ''} className="about-stat-number" />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.24}>
        <section className="about-section about-cta">
          <div className="container">
            <div className="about-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>
              <div className="about-cta-actions">
                <Link to={cta.primary_btn_url} className="btn-primary">
                  {cta.primary_btn_text}
                </Link>
                <Link to={cta.secondary_btn_url} className="btn-secondary about-cta-secondary">
                  {cta.secondary_btn_text}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default About
