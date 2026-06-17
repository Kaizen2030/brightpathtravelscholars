const fs = require('fs')
const fetch = globalThis.fetch || require('node-fetch')

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

  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error('Usage: node auth_signin.cjs <email> <password>')
    process.exit(1)
  }

  const endpoint = `${url.replace(/\/$/, '')}/auth/v1/token`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grant_type: 'password', email, password }),
    })

    const data = await res.json()
    console.log('status', res.status)
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Request failed:', err.message || err)
    process.exit(2)
  }
}

main()
