import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-error-boundary">
          <h2>Something went wrong</h2>
          <p>We encountered an unexpected error while loading this page. Try reloading the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
