const memoryCache = new Map()
const inFlight = new Map()

function now() {
  return Date.now()
}

export function readCache(key) {
  try {
    const entry = memoryCache.get(key)
    if (!entry) return null
    if (entry.expires && entry.expires < now()) {
      memoryCache.delete(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function writeCache(key, data, ttlMs = 300000) {
  try {
    const expires = ttlMs ? now() + ttlMs : null
    memoryCache.set(key, { data, expires })
  } catch {
    // ignore
  }
}

export async function fetchCached(key, fetcher, ttlMs = 300000) {
  const cached = readCache(key)
  if (cached !== null) return cached

  if (inFlight.has(key)) {
    return await inFlight.get(key)
  }

  const promise = (async () => {
    try {
      const result = await fetcher()
      writeCache(key, result, ttlMs)
      return result
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return await promise
}

export function clearCache(key) {
  try {
    memoryCache.delete(key)
  } catch {
    // ignore
  }
}

export default { readCache, writeCache, fetchCached, clearCache }
