import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) throw new Error('Missing Supabase env vars')

// Derive the session storage key the same way supabase-js does internally.
const sessionKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`

function readStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(sessionKey)
    if (!raw) return null
    const session = JSON.parse(raw) as { access_token?: string } | null
    return session?.access_token ?? null
  } catch {
    return null
  }
}

export const supabase = createClient(url, key, {
  global: {
    // fetchWithAuth falls back to the anon key when the LockManager is held by an
    // auto-refresh tick that started just before this request. Recover by reading
    // the real access token directly from localStorage — that storage write is
    // synchronous and completes before the refresh lock is released.
    fetch: async (input, init) => {
      const requestUrl = input instanceof Request ? input.url : String(input)
      if (requestUrl.includes('/rest/v1/')) {
        const headers = new Headers(init?.headers)
        const authHeader = headers.get('Authorization')
        const storedToken = readStoredAccessToken()
        console.log('[supabase-fetch] url:', requestUrl.split('?')[0])
        console.log('[supabase-fetch] auth header is anon key?', authHeader === `Bearer ${key}`)
        console.log('[supabase-fetch] stored token present?', !!storedToken)
        console.log('[supabase-fetch] localStorage key used:', sessionKey)
        console.log('[supabase-fetch] all localStorage keys:', Object.keys(localStorage))
        if (authHeader === `Bearer ${key}`) {
          if (storedToken) {
            headers.set('Authorization', `Bearer ${storedToken}`)
            console.log('[supabase-fetch] OVERRIDING auth header with stored token')
            return fetch(input, { ...init, headers })
          } else {
            console.warn('[supabase-fetch] anon key detected but no stored token — 403 incoming!')
          }
        }
      }
      return fetch(input, init)
    },
  },
})
