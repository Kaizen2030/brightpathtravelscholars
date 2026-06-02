import { Link } from 'react-router-dom'

function PlaceholderPage({
  badge,
  title,
  description,
  primaryAction = { label: 'Apply Now', to: '/apply' },
  secondaryAction = { label: 'Contact Us', to: '/contact' },
  meta = [],
}) {
  return (
    <section className="placeholder-page">
      <div className="container">
        <div className="placeholder-card">
          <span className="section-badge">{badge}</span>
          <h1>{title}</h1>
          <p>{description}</p>

          <div className="placeholder-actions">
            <Link className="btn-primary" to={primaryAction.to}>
              {primaryAction.label}
            </Link>
            <Link className="btn-secondary" to={secondaryAction.to}>
              {secondaryAction.label}
            </Link>
          </div>

          {meta.length > 0 && (
            <div className="placeholder-meta">
              {meta.map((item) => (
                <div key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PlaceholderPage
