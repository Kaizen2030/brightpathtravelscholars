import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Camera,
  LogIn,
  MessageSquareQuote,
  Reply,
  Send,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { usePageSections } from '../hooks/usePageSections'
import { COMMUNITY_CATEGORY_LABELS } from '../lib/communityCatalog'
import { getCommunityGalleryFallbackImages } from '../lib/fallbackImages'
import { supabase } from '../lib/supabaseClient'
import './Community.css'

const FALLBACK_TESTIMONIALS = [
  {
    id: 'community-1',
    author_name: 'Sharon W.',
    author_title: 'Studied in Canada',
    rating: 5,
    review_text: 'The team stayed close to every step and made the process feel much less overwhelming.',
  },
  {
    id: 'community-2',
    author_name: 'Brian M.',
    author_title: 'Studied in the UK',
    rating: 5,
    review_text: 'What stood out most was the speed, honesty, and structure. I always knew what came next.',
  },
  {
    id: 'community-3',
    author_name: 'Faith A.',
    author_title: 'Studied in Australia',
    rating: 5,
    review_text: 'The visa and scholarship guidance was practical. I felt supported from start to finish.',
  },
]

const TRUST_POINTS = [
  { title: 'What Families Say', body: 'Students and parents value clear timelines, practical advice, and honest course matching.' },
  { title: 'How We Handle Feedback', body: 'Every client remark helps us refine communication, application pacing, and support quality.' },
  { title: 'Why Students Return', body: 'Many students come back for postgraduate planning, sibling applications, or referrals.' },
]

const SAFETY_PILLARS = [
  { title: 'Respect First', body: 'We want students to feel safe asking questions, comparing options, and sharing concerns without pressure.' },
  { title: 'Verified Guidance', body: 'Our advice is grounded in admission requirements, document quality, and destination fit instead of guesswork.' },
  { title: 'Privacy Matters', body: 'Application details, finances, and academic records should be handled with care and discretion.' },
  { title: 'Supportive Spaces', body: 'Whether online or in person, we want conversations to feel welcoming, student-centered, and constructive.' },
]

const MEETUP_SPACES = [
  { title: 'Virtual Destination Rooms', body: 'Join topic-based sessions for Canada, UK, USA, Europe, and more.' },
  { title: 'Scholarship Clinics', body: 'Shortlist funding options, ask document questions, and understand what makes an application stronger.' },
  { title: 'Pre-Departure Circles', body: 'Meet other students preparing for the same intake or destination.' },
  { title: 'Alumni and Mentor Talks', body: 'Hear from students who have already gone through the process and settled abroad.' },
]

const COMMUNITY_PAGE_SIZE = 8

function formatDate(value) {
  if (!value) return 'Recently'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function sortAndGroupThreads(posts = [], replies = []) {
  const repliesByPost = new Map()

  replies.forEach((reply) => {
    const currentReplies = repliesByPost.get(reply.post_id) ?? []
    currentReplies.push(reply)
    repliesByPost.set(reply.post_id, currentReplies)
  })

  return posts
    .map((post) => ({
      ...post,
      replies: (repliesByPost.get(post.id) ?? []).sort(
        (first, second) => new Date(first.created_at) - new Date(second.created_at),
      ),
    }))
    .sort((first, second) => {
      if (first.is_pinned !== second.is_pinned) return Number(second.is_pinned) - Number(first.is_pinned)
      return new Date(second.created_at) - new Date(first.created_at)
    })
}

function getGalleryImages(moment, index = 0) {
  if (Array.isArray(moment?.image_urls) && moment.image_urls.length) {
    return moment.image_urls.filter(Boolean)
  }

  if (moment?.image_url) {
    return [moment.image_url]
  }

  return getCommunityGalleryFallbackImages(moment?.title || '', index)
}

function GalleryMomentCard({ moment, index }) {
  const images = useMemo(() => getGalleryImages(moment, index), [index, moment])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  useEffect(() => {
    if (images.length < 2) return undefined

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, 3200)

    return () => window.clearInterval(interval)
  }, [images])

  const activeImage = images[activeIndex] || images[0] || ''

  return (
    <article className={`community-gallery-card ${moment.tone || 'navy'}${activeImage ? ' has-image' : ''}`}>
      {activeImage ? (
        <div
          className="community-gallery-card-media"
          style={{
            backgroundImage: `linear-gradient(rgba(91, 44, 137, 0.12), rgba(53, 21, 83, 0.42)), url(${activeImage})`,
          }}
        >
          <img key={activeImage} className="community-gallery-card-image" src={activeImage} alt={moment.title} />
        </div>
      ) : null}

      <div className="community-gallery-card-content">
        <span className="community-gallery-icon">
          <Camera size={18} />
        </span>
        <h3>{moment.title}</h3>
        <p>{moment.caption}</p>

        {images.length > 1 ? (
          <span className="community-gallery-count">{activeIndex + 1}/{images.length}</span>
        ) : null}
      </div>
    </article>
  )
}

function Community() {
  const { sections } = usePageSections('community')
  const { user, profile, loading: authLoading, isAdmin } = useAuth()
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS)
  const [threads, setThreads] = useState([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [totalThreads, setTotalThreads] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState('all')
  const [questionForm, setQuestionForm] = useState({
    title: '',
    body: '',
    category: 'general',
  })
  const [replyDrafts, setReplyDrafts] = useState({})
  const [openReplyId, setOpenReplyId] = useState(null)
  const [boardNotice, setBoardNotice] = useState(null)
  const [postingQuestion, setPostingQuestion] = useState(false)
  const [postingReplyId, setPostingReplyId] = useState('')

  const hero = sections.hero
  const gallery = sections.gallery
  const board = sections.board
  const cta = sections.cta
  const categoryOptions = board?.settings?.categories ?? Object.entries(COMMUNITY_CATEGORY_LABELS).map(([key, label]) => ({ key, label }))
  const galleryItems = gallery?.items?.length ? gallery.items : []
  const heroStats = hero?.settings?.stats ?? []
  const replyCount = useMemo(
    () => threads.reduce((count, thread) => count + (thread.replies?.length ?? 0), 0),
    [threads],
  )
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalThreads / COMMUNITY_PAGE_SIZE)), [totalThreads])
  const showingStart = useMemo(
    () => (totalThreads && threads.length ? (currentPage - 1) * COMMUNITY_PAGE_SIZE + 1 : 0),
    [currentPage, threads.length, totalThreads],
  )
  const showingEnd = useMemo(
    () => (totalThreads && threads.length ? Math.min(currentPage * COMMUNITY_PAGE_SIZE, totalThreads) : 0),
    [currentPage, threads.length, totalThreads],
  )
  const visibleThreads = threads
  const hasPagination = totalThreads > COMMUNITY_PAGE_SIZE

  const loadThreads = useCallback(async (page = currentPage, category = activeCategory) => {
    setLoadingThreads(true)

    try {
      const from = Math.max(0, (page - 1) * COMMUNITY_PAGE_SIZE)
      const to = from + COMMUNITY_PAGE_SIZE - 1
      let postsQuery = supabase
        .from('community_posts')
        .select(
          'id, author_id, author_name, author_role, title, body, category, is_pinned, is_closed, created_at, updated_at',
          { count: 'exact' },
        )
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (category !== 'all') {
        postsQuery = postsQuery.eq('category', category)
      }

      const postsResponse = await postsQuery

      if (postsResponse.error) throw postsResponse.error

      const totalCount = postsResponse.count ?? 0
      const postsData = postsResponse.data ?? []

      if (totalCount === 0) {
        setTotalThreads(0)
        setThreads([])
        return
      }

      const totalPageCount = Math.max(1, Math.ceil(totalCount / COMMUNITY_PAGE_SIZE))
      setTotalThreads(totalCount)

      if (page > totalPageCount) {
        setCurrentPage(totalPageCount)
        return
      }

      const postIds = postsData.map((post) => post.id)
      const repliesResponse = postIds.length
        ? await supabase
            .from('community_replies')
            .select('id, post_id, author_id, author_name, author_role, body, created_at, updated_at')
            .in('post_id', postIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null }

      if (repliesResponse.error) throw repliesResponse.error

      if (postsData.length) {
        setThreads(sortAndGroupThreads(postsData, repliesResponse.data ?? []))
      } else {
        setThreads([])
      }
    } catch (error) {
      console.error('[Community] Failed to load discussion threads:', error)
      setTotalThreads(0)
      setThreads([])
    } finally {
      setLoadingThreads(false)
    }
  }, [activeCategory, currentPage])

  useEffect(() => {
    let ignore = false

    async function loadTestimonials() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('id, author_name, author_title, rating, review_text')
          .eq('is_published', true)
          .limit(9)

        if (ignore) return

        if (!error && data?.length) {
          setTestimonials(data)
        }
      } catch (error) {
        console.error('[Community] Failed to load testimonials:', error)
      }
    }

    loadTestimonials()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  async function handleQuestionSubmit(event) {
    event.preventDefault()

    if (!user) {
      setBoardNotice({ type: 'error', text: 'Sign in to start a discussion.' })
      return
    }

    if (!questionForm.title.trim() || !questionForm.body.trim()) {
      setBoardNotice({ type: 'error', text: 'Add both a title and a question before posting.' })
      return
    }

    setBoardNotice(null)
    setPostingQuestion(true)

    try {
      const authorName = isAdmin
        ? 'Brightpath Team'
        : profile?.full_name?.trim() || user.user_metadata?.full_name?.trim() || user.email || 'Student'

      const { error } = await supabase.from('community_posts').insert({
        author_id: user.id,
        author_name: authorName,
        author_role: isAdmin ? 'admin' : 'user',
        title: questionForm.title.trim(),
        body: questionForm.body.trim(),
        category: questionForm.category,
      })

      if (error) throw error

      setQuestionForm({
        title: '',
        body: '',
        category: 'general',
      })
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        await loadThreads(1, activeCategory)
      }
      setBoardNotice({ type: 'success', text: 'Your question is live. Other students can now reply.' })
    } catch (error) {
      console.error('[Community] Failed to post question:', error)
      setBoardNotice({ type: 'error', text: error.message || 'We could not post your question right now.' })
    } finally {
      setPostingQuestion(false)
    }
  }

  async function handleReplySubmit(postId) {
    const replyBody = (replyDrafts[postId] ?? '').trim()

    if (!user) {
      setBoardNotice({ type: 'error', text: 'Sign in to reply to a question.' })
      return
    }

    if (!replyBody) {
      setBoardNotice({ type: 'error', text: 'Write a reply before sending it.' })
      return
    }

    setPostingReplyId(postId)
    setBoardNotice(null)

    try {
      const authorName = isAdmin
        ? 'Brightpath Team'
        : profile?.full_name?.trim() || user.user_metadata?.full_name?.trim() || user.email || 'Student'

      const { error } = await supabase.from('community_replies').insert({
        post_id: postId,
        author_id: user.id,
        author_name: authorName,
        author_role: isAdmin ? 'admin' : 'user',
        body: replyBody,
      })

      if (error) throw error

      setReplyDrafts((current) => ({ ...current, [postId]: '' }))
      setOpenReplyId(postId)
      await loadThreads()
      setBoardNotice({ type: 'success', text: 'Reply posted. The conversation keeps moving.' })
    } catch (error) {
      console.error('[Community] Failed to post reply:', error)
      setBoardNotice({ type: 'error', text: error.message || 'We could not post your reply right now.' })
    } finally {
      setPostingReplyId('')
    }
  }

  return (
    <div className="community-page">
      <SEO
        title="Community"
        description="Explore student testimonials, gallery moments, and a signed-in community board where students can ask questions and reply to each other."
        path="/community"
      />

      <section className="community-hero">
        <div className="container community-hero-grid">
          <div>
            <span className="section-badge community-hero-badge">{hero.badge_text}</span>
            <h1>{hero.heading}</h1>
            <p>{hero.subheading}</p>

            <div className="community-hero-actions">
              <Link to={hero.primary_btn_url} className="btn-primary">
                {hero.primary_btn_text}
              </Link>
              <Link to={hero.secondary_btn_url} className="btn-secondary community-hero-secondary">
                {hero.secondary_btn_text}
              </Link>
            </div>
          </div>

          <article className="community-hero-panel">
            <span>Inside this space</span>
            <h2>Ask questions, answer each other, and keep the next student moving.</h2>
            <p>
              This page is designed like a living student community, not a static brochure. The images above can be
              managed from the admin panel, and the board below is where signed-in users can talk, ask, and reply.
            </p>

            {heroStats.length ? (
              <div className="community-hero-stats">
                {heroStats.map((stat) => (
                  <article key={stat.label} className="community-hero-stat">
                    <strong>
                      {stat.value}
                      {stat.suffix ?? ''}
                    </strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <AnimatedSection>
        <section className="community-section">
          <div className="container">
            <div className="community-section-header">
              <span className="section-badge">{gallery.badge_text}</span>
              <h2>{gallery.heading}</h2>
              <p>{gallery.subheading}</p>
            </div>

            <div className="community-gallery-grid">
              {galleryItems.map((moment, index) => (
                <GalleryMomentCard key={moment.title} moment={moment} index={index} />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="community-section alt community-board-section" id="community-board">
          <div className="container">
            <div className="community-section-header">
              <span className="section-badge">{board.badge_text}</span>
              <h2>{board.heading}</h2>
              <p>{board.subheading}</p>
            </div>

            <div className="community-board-grid">
              <article className="community-composer-card">
                <div className="community-composer-head">
                  <div>
                    <span className="community-board-kicker">{board.settings?.composer_title || 'Ask the community'}</span>
                    <h3>Start a new conversation</h3>
                  </div>

                  <div className="community-board-pill-row">
                    <span className="community-board-pill">{threads.length} Threads</span>
                    <span className="community-board-pill">{replyCount} Replies</span>
                  </div>
                </div>

                <p className="community-composer-body">
                  {board.settings?.composer_body ||
                    'Write a clear question so the team and other students can give useful answers.'}
                </p>

                {boardNotice ? (
                  <p className={`community-board-notice ${boardNotice.type}`}>{boardNotice.text}</p>
                ) : null}

                {user ? (
                  <form className="community-question-form" onSubmit={handleQuestionSubmit}>
                    <label className="community-field">
                      <span>Question title</span>
                      <input
                        type="text"
                        value={questionForm.title}
                        onChange={(event) => setQuestionForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Example: Which city is best for a budget-friendly masters?"
                      />
                    </label>

                    <label className="community-field">
                      <span>Category</span>
                      <select
                        value={questionForm.category}
                        onChange={(event) => setQuestionForm((current) => ({ ...current, category: event.target.value }))}
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="community-field community-field-full">
                      <span>Your question</span>
                      <textarea
                        rows="5"
                        value={questionForm.body}
                        onChange={(event) => setQuestionForm((current) => ({ ...current, body: event.target.value }))}
                        placeholder="Give a little context so people can answer well."
                      />
                    </label>

                    <button type="submit" className="btn-primary community-question-submit" disabled={postingQuestion || authLoading}>
                      <Send size={16} />
                      {postingQuestion ? 'Posting...' : 'Post Question'}
                    </button>
                  </form>
                ) : (
                  <div className="community-signin-card">
                    <LogIn size={18} />
                    <div>
                      <h4>Sign in to join the discussion</h4>
                      <p>Only signed-in users can ask questions and reply in the community board.</p>
                    </div>
                    <Link to="/login" className="btn-secondary">
                      Sign In
                    </Link>
                  </div>
                )}
              </article>

              <article className="community-guidelines-card">
                <span className="community-board-kicker">How we keep it useful</span>
                <h3>Community rules and support values</h3>
                <div className="community-guidelines-list">
                  {SAFETY_PILLARS.slice(0, 3).map((pillar) => (
                    <div key={pillar.title} className="community-guideline-item">
                      <ShieldCheck size={16} />
                      <div>
                        <strong>{pillar.title}</strong>
                        <p>{pillar.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="community-board-summary">
                  <article>
                    <strong>{loadingThreads ? '…' : threads.length ? `${showingStart}-${showingEnd}` : '0'}</strong>
                    <span>Showing now</span>
                  </article>
                  <article>
                    <strong>{loadingThreads ? '…' : totalThreads}</strong>
                    <span>Total threads</span>
                  </article>
                  <article>
                    <strong>{loadingThreads ? '…' : replyCount}</strong>
                    <span>Replies on page</span>
                  </article>
                </div>
              </article>
            </div>

            <div className="community-filter-row" role="tablist" aria-label="Community filters">
              <button
                type="button"
                className={`community-filter-chip${activeCategory === 'all' ? ' active' : ''}`}
                onClick={() => {
                  setActiveCategory('all')
                  setCurrentPage(1)
                }}
              >
                All
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`community-filter-chip${activeCategory === category.key ? ' active' : ''}`}
                  onClick={() => {
                    setActiveCategory(category.key)
                    setCurrentPage(1)
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="community-thread-list">
              {loadingThreads
                ? Array.from({ length: 3 }).map((_, index) => (
                    <article key={`community-thread-skeleton-${index}`} className="community-thread-card skeleton-card">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line small" />
                      <div className="skeleton-line tiny" />
                    </article>
                  ))
                : visibleThreads.map((thread) => {
                    const replyBody = replyDrafts[thread.id] ?? ''
                    const categoryLabel = COMMUNITY_CATEGORY_LABELS[thread.category] || 'General Questions'

                    return (
                      <article key={thread.id} className={`community-thread-card${thread.is_pinned ? ' pinned' : ''}`}>
                        <div className="community-thread-head">
                          <div>
                            <span className="community-thread-category">{categoryLabel}</span>
                            <h3>{thread.title}</h3>
                          </div>

                          <div className="community-thread-badges">
                            {thread.is_pinned ? <span className="community-thread-badge pinned">Pinned</span> : null}
                            <span className="community-thread-badge">{thread.replies?.length ?? 0} Replies</span>
                          </div>
                        </div>

                        <p className="community-thread-body">{thread.body}</p>

                        <div className="community-thread-footer">
                          <div className="community-thread-author">
                            <strong>{thread.author_name}</strong>
                            <span>{thread.author_role === 'admin' ? 'Brightpath Team' : 'Student'}</span>
                          </div>
                          <span className="community-thread-date">{formatDate(thread.created_at)}</span>
                        </div>

                        <div className="community-replies-list">
                          {(thread.replies ?? []).map((reply) => (
                            <article key={reply.id} className={`community-reply-card ${reply.author_role === 'admin' ? 'team-reply' : ''}`}>
                              <div className="community-reply-head">
                                <strong>{reply.author_name}</strong>
                                <span>{reply.author_role === 'admin' ? 'Brightpath Team' : 'Student'}</span>
                              </div>
                              <p>{reply.body}</p>
                              <span className="community-reply-date">{formatDate(reply.created_at)}</span>
                            </article>
                          ))}
                        </div>

                        {user ? (
                          <div className="community-reply-composer">
                            <button
                              type="button"
                              className="community-reply-toggle"
                              onClick={() =>
                                setOpenReplyId((current) => (current === thread.id ? null : thread.id))
                              }
                              disabled={thread.is_closed}
                            >
                              <Reply size={16} />
                              {thread.is_closed
                                ? 'Replies closed'
                                : openReplyId === thread.id
                                  ? 'Hide reply box'
                                  : 'Reply'}
                            </button>

                            {openReplyId === thread.id && !thread.is_closed ? (
                              <div className="community-reply-form">
                                <textarea
                                  rows="3"
                                  value={replyBody}
                                  onChange={(event) =>
                                    setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))
                                  }
                                  placeholder="Write a helpful reply for the student."
                                />
                                <div className="community-reply-actions">
                                  <span className="community-reply-hint">Replying as {profile?.full_name?.trim() || user.email}</span>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleReplySubmit(thread.id)}
                                    disabled={postingReplyId === thread.id}
                                  >
                                    {postingReplyId === thread.id ? 'Sending...' : 'Send Reply'}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="community-reply-login">
                            <p>Sign in to reply or start a new conversation.</p>
                            <Link to="/login" className="btn-secondary">
                              Sign In
                            </Link>
                          </div>
                        )}
                      </article>
                    )
                  })}
            </div>

            {hasPagination && visibleThreads.length > 0 ? (
              <div className="community-pagination" aria-label="Community pagination">
                <div className="community-pagination-meta">
                  <strong>
                    Page {currentPage} of {totalPages}
                  </strong>
                  <span>
                    Showing {showingStart}-{showingEnd} of {totalThreads} questions
                  </span>
                </div>

                <div className="community-pagination-controls">
                  <button
                    type="button"
                    className="community-pagination-button"
                    onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1 || loadingThreads}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="community-pagination-button"
                    onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                    disabled={currentPage === totalPages || loadingThreads}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}

            {!loadingThreads && visibleThreads.length === 0 ? (
              <div className="community-empty-state">
                <h3>{board.settings?.empty_heading || 'No questions yet — start the first conversation.'}</h3>
                <p>{board.settings?.empty_body || 'Be the first to ask a useful question for your journey.'}</p>
              </div>
            ) : null}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <section className="community-section">
          <div className="container community-split-grid">
            <div>
              <div className="community-section-header">
                <span className="section-badge">Student Voices</span>
                <h2>Testimonials and client feedback</h2>
                <p>Real remarks from students who moved through the journey with Brightpath.</p>
              </div>

              <div className="community-testimonials-grid">
                {testimonials.map((testimonial) => (
                  <article key={testimonial.id} className="community-testimonial-card">
                    <div className="community-stars">
                      {Array.from({ length: testimonial.rating || 5 }).map((_, index) => (
                        <Star key={`${testimonial.id}-${index}`} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p>"{testimonial.review_text}"</p>
                    <div className="community-testimonial-author">
                      <strong>{testimonial.author_name}</strong>
                      <span>{testimonial.author_title || 'Student review'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="community-section-header">
                <span className="section-badge">Safe Community</span>
                <h2>A student-safe space by design</h2>
              </div>

              <div className="community-safety-grid">
                {SAFETY_PILLARS.map((pillar) => (
                  <article key={pillar.title} className="community-info-card">
                    <span className="community-info-icon shield">
                      <ShieldCheck size={18} />
                    </span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.16}>
        <section className="community-section alt">
          <div className="container">
            <div className="community-section-header">
              <span className="section-badge">Meet & Connect</span>
              <h2>Places students can meet, ask, and learn together</h2>
              <p>These are the kinds of spaces we can keep building into the Brightpath experience on-site and through live events.</p>
            </div>

            <div className="community-meetup-grid">
              {MEETUP_SPACES.map((space, index) => {
                const icons = [Users, CalendarDays, ShieldCheck, MessageSquareQuote]
                const Icon = icons[index] || Users

                return (
                  <article key={space.title} className="community-meetup-card">
                    <span className="community-info-icon">
                      <Icon size={18} />
                    </span>
                    <h3>{space.title}</h3>
                    <p>{space.body}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <section className="community-section community-cta">
          <div className="container">
            <div className="community-cta-panel">
              <div>
                <span className="section-badge">{cta.badge_text}</span>
                <h2>{cta.heading}</h2>
                <p>{cta.subheading}</p>
              </div>

              <div className="community-cta-actions">
                <Link to={cta.primary_btn_url} className="btn-primary">
                  {cta.primary_btn_text}
                </Link>
                <Link to={cta.secondary_btn_url} className="btn-secondary community-cta-secondary">
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

export default Community
