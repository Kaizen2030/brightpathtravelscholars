import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Clock3,
  Globe2,
  Layers3,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const ANALYTICS_RANGES = [
  { key: '24h', label: '24H', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
]

function formatRelativeTime(value) {
  if (!value) return 'Just now'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function getRangeStart(rangeKey) {
  const selected = ANALYTICS_RANGES.find((item) => item.key === rangeKey) || ANALYTICS_RANGES[1]
  return new Date(Date.now() - selected.days * 24 * 60 * 60 * 1000)
}

function groupCount(items, keyGetter) {
  const map = new Map()

  items.forEach((item) => {
    const key = keyGetter(item) || 'Unknown'
    map.set(key, (map.get(key) ?? 0) + 1)
  })

  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
}

function groupSessionsBy(items, keyGetter) {
  const map = new Map()

  items.forEach((item) => {
    const key = keyGetter(item) || 'Unknown'
    if (!map.has(key)) {
      map.set(key, new Set())
    }
    map.get(key).add(item.session_id)
  })

  return [...map.entries()]
    .map(([label, sessionSet]) => ({ label, count: sessionSet.size }))
    .sort((left, right) => right.count - left.count)
}

function formatCountryKey(rawKey) {
  const [countryName = 'Unknown', countryCode = ''] = `${rawKey || 'Unknown|'}`.split('|')
  return countryCode ? `${countryName} (${countryCode})` : countryName
}

function getCountryKey(item) {
  return `${item?.country_name || 'Unknown'}|${item?.country_code || ''}`
}

function buildTrendPoints(events, days) {
  const points = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    const key = date.toISOString().slice(0, 10)
    const count = events.filter((event) => event.created_at?.startsWith(key)).length
    points.push({
      key,
      label: formatDayLabel(date),
      count,
    })
  }

  return points
}

function buildPageRows(events) {
  const map = new Map()

  events.forEach((event) => {
    const key = event.page_title || event.path || 'Unknown'
    const current = map.get(key) || {
      label: key,
      path: event.path || '/',
      views: 0,
      visitors: new Set(),
      lastSeen: '',
    }

    current.views += 1
    current.visitors.add(event.session_id)

    if (!current.lastSeen || new Date(event.created_at) > new Date(current.lastSeen)) {
      current.lastSeen = event.created_at
    }

    map.set(key, current)
  })

  return [...map.values()]
    .map((item) => ({
      label: item.label,
      path: item.path,
      views: item.views,
      visitors: item.visitors.size,
      lastSeen: item.lastSeen,
    }))
    .sort((left, right) => right.views - left.views)
}

function AnalyticsBarList({ items, valueLabel = 'views', color = 'gold' }) {
  const maxValue = Math.max(1, ...items.map((item) => item.count || item.views || 0))

  return (
    <div className="analytics-bar-list">
      {items.map((item) => {
        const value = item.count ?? item.views ?? 0
        const width = `${Math.max(6, Math.round((value / maxValue) * 100))}%`

        return (
          <div key={item.label} className="analytics-bar-row">
            <div className="analytics-bar-meta">
              <strong>{item.label}</strong>
              <span>
                {value} {valueLabel}
              </span>
            </div>
            <div className="analytics-bar-track">
              <div className={`analytics-bar-fill ${color}`} style={{ width }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AnalyticsPanel() {
  const [range, setRange] = useState('7d')
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [sessions, setSessions] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadAnalytics() {
      setLoading(true)
      setError('')

      const since = getRangeStart(range).toISOString()

      try {
        const [sessionsResult, eventsResult] = await Promise.all([
          supabase
            .from('analytics_sessions')
            .select('session_id, user_id, email, country_name, country_code, device_type, current_path, current_title, first_seen, last_seen')
            .gte('last_seen', since)
            .order('last_seen', { ascending: false }),
          supabase
            .from('analytics_events')
            .select('session_id, user_id, path, page_title, referrer, country_name, country_code, device_type, event_type, created_at')
            .gte('created_at', since)
            .order('created_at', { ascending: false }),
        ])

        const firstError = [sessionsResult.error, eventsResult.error].find(Boolean)
        if (firstError) throw firstError

        if (ignore) return

        setSessions(sessionsResult.data ?? [])
        setEvents(eventsResult.data ?? [])
        setLastUpdated(new Date())
      } catch (fetchError) {
        console.error('[AnalyticsPanel] Failed to load analytics:', fetchError)
        if (!ignore) {
          setError(fetchError.message || 'Could not load analytics right now.')
          setSessions([])
          setEvents([])
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()

    const refreshTimer = window.setInterval(loadAnalytics, 60000)

    return () => {
      ignore = true
      window.clearInterval(refreshTimer)
    }
  }, [range, refreshToken])

  const analytics = useMemo(() => {
    const liveThreshold = Date.now() - 5 * 60 * 1000
    const liveSessions = sessions.filter((session) => {
      const lastSeen = new Date(session.last_seen).getTime()
      return Number.isFinite(lastSeen) && lastSeen >= liveThreshold
    })

    const pageRows = buildPageRows(events)
    const countryRowsDetailed = groupSessionsBy(sessions, getCountryKey)
      .map((item) => {
        return {
          key: item.label,
          label: formatCountryKey(item.label),
          count: item.count,
        }
      })
      .slice(0, 6)

    const deviceRows = groupCount(sessions, (session) => session.device_type || 'desktop').slice(0, 4)
    const trendRows = buildTrendPoints(events, ANALYTICS_RANGES.find((item) => item.key === range)?.days || 7)
    const selectedCountryKey = selectedCountry === 'all' ? '' : selectedCountry
    const selectedCountryLabel = selectedCountry === 'all' ? 'All countries' : formatCountryKey(selectedCountry)
    const filteredEvents = selectedCountryKey
      ? events.filter((event) => getCountryKey(event) === selectedCountryKey)
      : events
    const filteredSessions = selectedCountryKey
      ? sessions.filter((session) => getCountryKey(session) === selectedCountryKey)
      : sessions
    const countryPageRows = buildPageRows(filteredEvents).slice(0, 8)
    const signedInSessions = filteredSessions.filter((session) => session.user_id).length
    const guestSessions = filteredSessions.length - signedInSessions
    const signedInViews = filteredEvents.filter((event) => event.user_id).length
    const guestViews = filteredEvents.length - signedInViews
    const trafficSplitRows = [
      { label: 'Signed-in sessions', count: signedInSessions },
      { label: 'Guest sessions', count: guestSessions },
      { label: 'Signed-in page views', count: signedInViews },
      { label: 'Guest page views', count: guestViews },
    ].filter((item) => item.count >= 0)

    const pageViews = events.length
    const uniqueVisitors = sessions.length
    const liveUsers = liveSessions.length
    const authenticatedUsers = new Set(sessions.filter((session) => session.user_id).map((session) => session.user_id)).size
    const countries = new Set(
      sessions.map((session) => (session.country_code || session.country_name || 'Unknown').trim()).filter(Boolean),
    ).size

    return {
      liveSessions,
      pageRows,
      countryRowsDetailed,
      deviceRows,
      trendRows,
      countryPageRows,
      trafficSplitRows,
      selectedCountryLabel,
      pageViews,
      uniqueVisitors,
      liveUsers,
      authenticatedUsers,
      countries,
      avgViewsPerVisitor: uniqueVisitors ? (pageViews / uniqueVisitors).toFixed(1) : '0.0',
    }
  }, [events, range, selectedCountry, sessions])

  useEffect(() => {
    if (selectedCountry !== 'all' && !analytics.countryRowsDetailed.some((item) => item.key === selectedCountry)) {
      setSelectedCountry('all')
    }
  }, [analytics.countryRowsDetailed, selectedCountry])

  return (
    <section className="admin-panel-card analytics-panel">
      <div className="admin-panel-card-header analytics-header">
        <div>
          <h2>Analytics</h2>
          <p>Live traffic, countries, pages, and visitor behavior.</p>
        </div>

        <div className="analytics-toolbar">
          <div className="analytics-range-group" role="tablist" aria-label="Analytics range">
            {ANALYTICS_RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`analytics-range-button${range === option.key ? ' active' : ''}`}
                onClick={() => setRange(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-soft analytics-refresh"
            onClick={() => setRefreshToken((current) => current + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="admin-notice error">{error}</div> : null}

      {loading ? <div className="admin-loading">Loading analytics...</div> : null}

      <div className="analytics-kpi-grid">
        <article className="analytics-kpi-card">
          <Activity size={18} />
          <span>Live users</span>
          <strong>{analytics.liveUsers}</strong>
          <small>active in the last 5 minutes</small>
        </article>
        <article className="analytics-kpi-card">
          <MousePointerClick size={18} />
          <span>Page views</span>
          <strong>{analytics.pageViews}</strong>
          <small>in the selected range</small>
        </article>
        <article className="analytics-kpi-card">
          <Users size={18} />
          <span>Unique visitors</span>
          <strong>{analytics.uniqueVisitors}</strong>
          <small>distinct sessions tracked</small>
        </article>
        <article className="analytics-kpi-card">
          <Globe2 size={18} />
          <span>Countries</span>
          <strong>{analytics.countries}</strong>
          <small>visitor locations detected</small>
        </article>
        <article className="analytics-kpi-card">
          <Smartphone size={18} />
          <span>Signed-in users</span>
          <strong>{analytics.authenticatedUsers}</strong>
          <small>sessions linked to accounts</small>
        </article>
        <article className="analytics-kpi-card">
          <Layers3 size={18} />
          <span>Views per visitor</span>
          <strong>{analytics.avgViewsPerVisitor}</strong>
          <small>average page views per session</small>
        </article>
      </div>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Traffic trend</h3>
              <p>Page views by day</p>
            </div>
          </div>
          <div className="analytics-trend">
            {analytics.trendRows.map((point) => {
              const maxValue = Math.max(1, ...analytics.trendRows.map((row) => row.count))
              const height = `${Math.max(10, Math.round((point.count / maxValue) * 100))}%`

              return (
                <div key={point.key} className="analytics-trend-column">
                  <div className="analytics-trend-bar-track">
                    <div className="analytics-trend-bar" style={{ height }} />
                  </div>
                  <strong>{point.count}</strong>
                  <span>{point.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Top pages</h3>
              <p>Most viewed routes and content</p>
            </div>
          </div>
          <AnalyticsBarList items={analytics.pageRows.slice(0, 6)} valueLabel="views" />
        </section>
      </div>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Countries</h3>
              <p>Visitors by location</p>
            </div>
          </div>
          <div className="analytics-country-controls">
            <label className="analytics-country-select-wrap">
              <span>Drill down</span>
              <select
                className="analytics-country-select"
                value={selectedCountry}
                onChange={(event) => setSelectedCountry(event.target.value)}
              >
                <option value="all">All countries</option>
                {analytics.countryRowsDetailed.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <AnalyticsBarList items={analytics.countryRowsDetailed} valueLabel="visitors" color="sky" />
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Devices</h3>
              <p>Visitor device mix</p>
            </div>
          </div>
          <AnalyticsBarList items={analytics.deviceRows} valueLabel="sessions" color="emerald" />
        </section>
      </div>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Traffic split</h3>
              <p>Signed-in versus anonymous traffic</p>
            </div>
          </div>
          <AnalyticsBarList items={analytics.trafficSplitRows} valueLabel="visits" color="gold" />
        </section>

        <section className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h3>Country drill-down</h3>
              <p>{analytics.selectedCountryLabel}</p>
            </div>
          </div>

          <div className="admin-table-wrap analytics-drill-table-wrap">
            <table className="admin-table analytics-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Visitors</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
              {analytics.countryPageRows.map((row) => (
                <tr key={`${row.path}-${row.label}`}>
                  <td data-label="Page">{row.label}</td>
                  <td data-label="Views">{row.views}</td>
                  <td data-label="Visitors">{row.visitors}</td>
                  <td data-label="Last Seen">{formatRelativeTime(row.lastSeen)}</td>
                </tr>
              ))}
              </tbody>
            </table>
            {!analytics.countryPageRows.length ? (
              <p className="admin-empty">No page views available for this country yet.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="analytics-card analytics-table-card">
        <div className="analytics-card-header">
          <div>
            <h3>Live sessions</h3>
            <p>Visitors active in the last few minutes</p>
          </div>
          <span className="analytics-updated">
            <Clock3 size={14} />
            {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : 'Waiting for data'}
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table analytics-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Country</th>
                <th>Current Page</th>
                <th>Device</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {analytics.liveSessions.map((session) => (
                <tr key={session.session_id}>
                  <td data-label="Visitor">{session.email || session.user_id || session.session_id.slice(0, 8)}</td>
                  <td data-label="Country">{session.country_name || 'Unknown'}</td>
                  <td data-label="Current Page">{session.current_title || session.current_path || 'Unknown'}</td>
                  <td data-label="Device">{session.device_type || 'desktop'}</td>
                  <td data-label="Last Seen">{formatRelativeTime(session.last_seen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!analytics.liveSessions.length ? <p className="admin-empty">No active users right now.</p> : null}
        </div>
      </section>
    </section>
  )
}

export default AnalyticsPanel
