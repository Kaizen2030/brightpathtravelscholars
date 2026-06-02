/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})
const SESSION_TIMEOUT_MS = 8000
const AUTH_CACHE_STORAGE_KEY = 'nexora-auth-cache-v1'

function readAuthCache() {
  try {
    const rawValue = window.localStorage.getItem(AUTH_CACHE_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

function writeAuthCache(user, profile) {
  try {
    if (!user) {
      window.localStorage.removeItem(AUTH_CACHE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      AUTH_CACHE_STORAGE_KEY,
      JSON.stringify({
        user,
        profile,
      }),
    )
  } catch {
    // Ignore storage issues and keep auth usable.
  }
}

function withTimeout(promise, message, timeoutMs = SESSION_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

export function AuthProvider({ children }) {
  const cachedAuth = readAuthCache()
  const [user, setUser] = useState(cachedAuth?.user ?? null)
  const [profile, setProfile] = useState(cachedAuth?.profile ?? null)
  const [loading, setLoading] = useState(!cachedAuth?.user)
  const isAdmin = profile?.role === 'admin'
  const authSnapshotRef = useRef({
    user: cachedAuth?.user ?? null,
    profile: cachedAuth?.profile ?? null,
  })

  useEffect(() => {
    authSnapshotRef.current = { user, profile }
  }, [profile, user])

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      'Timed out while loading your profile.',
    )

    if (error) throw error
    return data ?? null
  }, [])

  const ensureProfile = useCallback(
    async (nextUser) => {
      const existingProfile = await fetchProfile(nextUser.id)
      if (existingProfile) return existingProfile

      const fullName =
        nextUser.user_metadata?.full_name ??
        nextUser.user_metadata?.name ??
        [nextUser.user_metadata?.given_name, nextUser.user_metadata?.family_name]
          .filter(Boolean)
          .join(' ')

      const profilePayload = {
        id: nextUser.id,
        email: nextUser.email ?? '',
        full_name: fullName || '',
        phone: nextUser.user_metadata?.phone ?? '',
        role: 'user',
      }

      const { error } = await withTimeout(
        supabase.from('profiles').insert(profilePayload),
        'Timed out while creating your profile.',
      )

      if (error && error.code !== '23505') throw error

      return fetchProfile(nextUser.id)
    },
    [fetchProfile],
  )

  const refreshProfile = useCallback(
    async (userId = user?.id) => {
      if (!userId) return null

      const nextProfile = await fetchProfile(userId)
      setProfile(nextProfile)
      return nextProfile
    },
    [fetchProfile, user?.id],
  )

  useEffect(() => {
    let isActive = true

    async function applySession(session, options = {}) {
      if (!isActive) return

      const nextUser = session?.user ?? null
      const currentSnapshot = authSnapshotRef.current
      const currentUserId = currentSnapshot.user?.id ?? null
      const nextUserId = nextUser?.id ?? null
      const keepResolvedState =
        options.keepResolvedState &&
        Boolean(nextUserId && currentUserId === nextUserId && currentSnapshot.profile)

      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        writeAuthCache(null, null)
        setLoading(false)
        return
      }

      try {
        const nextProfile = await ensureProfile(nextUser)
        if (!isActive) return
        setProfile(nextProfile)
        writeAuthCache(nextUser, nextProfile)
      } catch (error) {
        console.error('[Auth] Profile load failed:', error)
        if (!isActive) return
        const fallbackProfile =
          currentUserId === nextUserId ? currentSnapshot.profile : null

        if (fallbackProfile) {
          setProfile(fallbackProfile)
        }

        writeAuthCache(nextUser, fallbackProfile)
      } finally {
        if (isActive && !keepResolvedState) setLoading(false)
      }
    }

    async function restoreSession() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          'Timed out while restoring your saved session.',
        )

        if (error) throw error
        await applySession(data?.session ?? null)
      } catch (error) {
        console.error('[Auth] Load failed:', error)
        if (!isActive) return
        setUser(null)
        setProfile(null)
        writeAuthCache(null, null)
        setLoading(false)
      }
    }

    restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null
      const currentSnapshot = authSnapshotRef.current
      const hasResolvedProfile =
        Boolean(currentSnapshot.user?.id) &&
        currentSnapshot.user?.id === nextUser?.id &&
        Boolean(currentSnapshot.profile)

      if (event === 'SIGNED_OUT') {
        setLoading(Boolean(currentSnapshot.user))
        void applySession(session)
        return
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        if (!hasResolvedProfile) {
          setLoading(true)
        }
        void applySession(session, { keepResolvedState: hasResolvedProfile })
        return
      }

      // Ignore token refresh focus churn so the UI does not flash or feel like a reload.
      setUser(nextUser)
      writeAuthCache(nextUser, currentSnapshot.profile)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [ensureProfile, profile])

  async function updateProfile(updates) {
    if (!user?.id) {
      throw new Error('You must be signed in to update your profile.')
    }

    const profileUpdates = {
      full_name: updates.full_name?.trim() ?? profile?.full_name ?? '',
      phone: updates.phone?.trim() ?? profile?.phone ?? '',
    }

    const { error: profileError } = await withTimeout(
      supabase.from('profiles').update(profileUpdates).eq('id', user.id),
      'Timed out while saving your profile.',
    )

    if (profileError) throw profileError

    const metadataUpdates = {
      full_name: profileUpdates.full_name,
      phone: profileUpdates.phone,
    }

    const { error: authError } = await withTimeout(
      supabase.auth.updateUser({ data: metadataUpdates }),
      'Timed out while syncing your account details.',
    )

    if (authError) throw authError

    const nextProfile = await refreshProfile(user.id)
    writeAuthCache(user, nextProfile)
    return nextProfile
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
