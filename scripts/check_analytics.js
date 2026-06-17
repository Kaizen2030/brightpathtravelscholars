const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

function readEnv() {
  const envPath = 'c:/brightpathtravels/.env'
  const raw = fs.readFileSync(envPath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const obj = {}
  for (const line of lines) {
    const m = line.match(/^\s*([^=]+)=([^]*)$/)
    if (m) obj[m[1]] = m[2]
  }
  return obj
}

async function main() {
  const env = readEnv()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('Missing supabase env in .env')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  try {
    const { data: sessions, error: sErr } = await supabase
      .from('analytics_sessions')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(5)

    if (sErr) throw sErr

    const { data: events, error: eErr } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (eErr) throw eErr

    console.log('Recent analytics_sessions (up to 5):')
    console.log(JSON.stringify(sessions, null, 2))
    console.log('\nRecent analytics_events (up to 10):')
    console.log(JSON.stringify(events, null, 2))
  } catch (err) {
    console.error('Query failed:', err.message || err)
    process.exit(2)
  }
}

main()
