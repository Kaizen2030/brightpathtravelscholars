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
    const payload = {
      session_id: `test-${Date.now()}`,
      user_id: null,
      path: '/test-insert',
      page_title: 'Test Insert',
      referrer: '',
      country_code: 'US',
      country_name: 'United States',
      device_type: 'desktop',
      event_type: 'page_view',
    }

    const { data, error } = await supabase.from('analytics_events').insert(payload).select()
    if (error) throw error
    console.log('Inserted:', data)

    const { data: events } = await supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(5)
    console.log('Recent events:', events)
  } catch (err) {
    console.error('Insert failed:', err.message || err)
    process.exit(2)
  }
}

main()
