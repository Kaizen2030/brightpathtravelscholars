import { useEffect, useState } from 'react'
import { Calendar, ChevronRight, Eye, User2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'
import SEO from '../components/SEO'
import SimpleMarkdown from '../components/SimpleMarkdown'
import { getBlogFallbackImage } from '../lib/fallbackImages'
import { supabase } from '../lib/supabaseClient'
import './BlogPost.css'

function formatDate(value) {
  if (!value) return 'Recently published'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadPost() {
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(
            'id, title, slug, excerpt, content, cover_image_url, author_name, category, published_at, is_published, view_count',
          )
          .eq('slug', slug)
          .maybeSingle()

        if (ignore) return

        if (error || !data || data.is_published === false) {
          setPost(null)
          setRelatedPosts([])
          return
        }

        setPost(data)

        const nextViewCount = (data.view_count || 0) + 1
        setPost((current) => (current ? { ...current, view_count: nextViewCount } : current))

        void supabase.from('blog_posts').update({ view_count: nextViewCount }).eq('id', data.id)

        if (data.category) {
          const { data: relatedData } = await supabase
            .from('blog_posts')
            .select('id, title, slug, excerpt, cover_image_url, category, published_at')
            .eq('is_published', true)
            .eq('category', data.category)
            .neq('slug', data.slug)
            .order('published_at', { ascending: false })
            .limit(3)

          if (!ignore) {
            setRelatedPosts(relatedData ?? [])
          }
        } else {
          setRelatedPosts([])
        }
      } catch (error) {
        console.error('[BlogPost] Failed to load post:', error)
        if (!ignore) {
          setPost(null)
          setRelatedPosts([])
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadPost()

    return () => {
      ignore = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="blog-post-page">
        <section className="blog-post-loading">
          <div className="container">
            <h1>Loading article...</h1>
          </div>
        </section>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="blog-post-page">
        <SEO title="Blog Post" description="This Brightpath article could not be found." path={`/blog/${slug || ''}`} noindex />
        <section className="blog-post-empty">
          <div className="container">
            <div className="blog-post-empty-card">
              <h1>Article not found.</h1>
              <p>The article you are looking for is unavailable or unpublished.</p>
              <Link to="/blog" className="btn-primary">
                Back to Blog
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="blog-post-page">
      <SEO
        title={post.title}
        description={post.excerpt || 'Read the latest Brightpath Travel Scholars blog post.'}
        path={`/blog/${post.slug}`}
      />

      <section className="blog-post-hero">
        <div className="container">
          <div className="blog-post-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span>{post.title}</span>
          </div>
          <span className="section-badge blog-post-badge">{post.category || 'Article'}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt || 'Practical guidance from Brightpath Travel Scholars.'}</p>
          <div className="blog-post-meta">
            <span>
              <User2 size={15} />
              {post.author_name || 'Brightpath Team'}
            </span>
            <span>
              <Calendar size={15} />
              {formatDate(post.published_at)}
            </span>
            <span>
              <Eye size={15} />
              {post.view_count || 0} views
            </span>
          </div>
        </div>
      </section>

      <AnimatedSection>
        <section className="blog-post-section">
          <div className="container">
            <div
              className="blog-post-cover"
              style={{
                backgroundImage: `linear-gradient(rgba(91, 44, 137, 0.12), rgba(53, 21, 83, 0.36)), url(${post.cover_image_url || getBlogFallbackImage(0, post.category)})`,
              }}
            />

            <article className="blog-post-content">
              <SimpleMarkdown content={post.content || post.excerpt || ''} />
            </article>
          </div>
        </section>
      </AnimatedSection>

      {relatedPosts.length > 0 ? (
        <AnimatedSection delay={0.08}>
          <section className="blog-post-section alt">
            <div className="container">
              <div className="blog-post-related-header">
                <span className="section-badge">Related Posts</span>
                <h2>More in {post.category}</h2>
              </div>

              <div className="blog-post-related-grid">
                {relatedPosts.map((related, index) => (
                  <article key={related.id} className="blog-post-related-card">
                    <div
                      className="blog-post-related-media"
                      style={{
                        backgroundImage: related.cover_image_url
                          ? `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.38)), url(${related.cover_image_url})`
                          : `linear-gradient(rgba(91, 44, 137, 0.18), rgba(53, 21, 83, 0.38)), url(${getBlogFallbackImage(index + 1, related.category)})`,
                      }}
                    />
                    <div className="blog-post-related-content">
                      <span>{related.category || 'Article'}</span>
                      <h3>{related.title}</h3>
                      <p>{related.excerpt || 'Continue reading related guidance from Brightpath.'}</p>
                      <Link to={`/blog/${related.slug}`} className="blog-post-related-link">
                        Read Article
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      ) : null}
    </div>
  )
}

export default BlogPost
