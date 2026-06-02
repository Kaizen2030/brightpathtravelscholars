import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight, User2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import { usePageSections } from '../hooks/usePageSections'
import { getBlogFallbackImage } from '../lib/fallbackImages'
import { supabase } from '../lib/supabaseClient'
import './Blog.css'

const POSTS_PER_PAGE = 9

function formatDate(value) {
  if (!value) return 'Recently published'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function truncate(text, maxLength = 120) {
  if (!text) return 'Read the latest insight from the Brightpath team.'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trim()}...`
}

function normalizeCategory(category) {
  return (category || '').trim().toLowerCase()
}

function Blog() {
  const { sections } = usePageSections('blog')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let ignore = false

    async function loadPosts() {
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(
            'id, title, slug, excerpt, content, cover_image_url, author_name, category, published_at, is_published, view_count',
          )
          .eq('is_published', true)
          .order('published_at', { ascending: false })

        if (ignore) return

        if (!error && data) {
          setPosts(data)
        }
      } catch (error) {
        console.error('[Blog] Failed to load posts:', error)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadPosts()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [activeFilter])

  const hero = sections.hero
  const featured = sections.featured
  const grid = sections.grid
  const filters = hero.settings?.filters ?? ['All']

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'All') return posts
    return posts.filter((post) => normalizeCategory(post.category) === normalizeCategory(activeFilter))
  }, [activeFilter, posts])

  const featuredPost = filteredPosts[0] || null
  const paginatedPosts = filteredPosts.slice(1)
  const totalPages = Math.max(1, Math.ceil(paginatedPosts.length / POSTS_PER_PAGE))
  const pageItems = paginatedPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  return (
    <div className="blog-page">
      <SEO
        title="Blog"
        description="Read Brightpath Travel Scholars articles on study tips, destination guidance, scholarships, visa preparation, and student success stories."
        path="/blog"
      />

      <section className="blog-hero">
        <div className="container">
          <span className="section-badge blog-hero-badge">{hero.badge_text}</span>
          <h1>{hero.heading}</h1>
          <p>{hero.subheading}</p>
        </div>
      </section>

      <section className="blog-filter-bar">
        <div className="container">
          <div className="blog-filter-row">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`blog-filter-chip${activeFilter === filter ? ' active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="blog-section">
          <div className="container">
            {loading ? (
              <div className="blog-empty-state">
                <h2>{featured.settings?.loading_heading || 'Loading posts...'}</h2>
                <p>{featured.settings?.loading_body || 'We are pulling the latest articles from Brightpath.'}</p>
              </div>
            ) : featuredPost ? (
              <article className="featured-post">
                <div
                  className="featured-post-media"
                  style={{
                    backgroundImage: featuredPost.cover_image_url
                      ? `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.5)), url(${featuredPost.cover_image_url})`
                      : `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.5)), url(${getBlogFallbackImage(0, featuredPost.category)})`,
                  }}
                />
                <div className="featured-post-content">
                  <span className="featured-post-category">{featuredPost.category || 'Featured'}</span>
                  <h2>{featuredPost.title}</h2>
                  <p>{featuredPost.excerpt || truncate(featuredPost.content, 180)}</p>
                  <div className="blog-post-meta">
                    <span>
                      <User2 size={15} />
                      {featuredPost.author_name || 'Brightpath Team'}
                    </span>
                    <span>
                      <Calendar size={15} />
                      {formatDate(featuredPost.published_at)}
                    </span>
                  </div>
                  <Link to={`/blog/${featuredPost.slug}`} className="featured-post-link">
                    Read More
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </article>
            ) : (
              <div className="blog-empty-state">
                <h2>{featured.heading}</h2>
                <p>{featured.subheading}</p>
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <section className="blog-section alt">
          <div className="container">
            <div className="blog-grid">
              {pageItems.map((post, index) => (
                <article key={post.id} className="blog-card">
                  <div
                    className="blog-card-media"
                    style={{
                      backgroundImage: post.cover_image_url
                        ? `linear-gradient(rgba(91, 44, 137, 0.16), rgba(53, 21, 83, 0.4)), url(${post.cover_image_url})`
                        : `linear-gradient(rgba(91, 44, 137, 0.16), rgba(53, 21, 83, 0.4)), url(${getBlogFallbackImage(index + 1, post.category)})`,
                    }}
                  />
                  <div className="blog-card-content">
                    <span className="blog-card-category">{post.category || 'Article'}</span>
                    <h3>{post.title}</h3>
                    <p>{truncate(post.excerpt || post.content)}</p>
                    <div className="blog-post-meta">
                      <span>
                        <User2 size={15} />
                        {post.author_name || 'Brightpath Team'}
                      </span>
                      <span>
                        <Calendar size={15} />
                        {formatDate(post.published_at)}
                      </span>
                    </div>
                    <Link to={`/blog/${post.slug}`} className="blog-card-link">
                      Read More
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {!loading && !pageItems.length && featuredPost ? (
              <div className="blog-empty-state compact">
                <p>{grid.settings?.empty_body || 'No additional posts for this filter on the current page.'}</p>
              </div>
            ) : null}

            {!loading && paginatedPosts.length > 0 ? (
              <div className="blog-pagination">
                <button
                  type="button"
                  className="blog-page-btn"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="blog-page-btn"
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </AnimatedSection>
    </div>
  )
}

export default Blog
