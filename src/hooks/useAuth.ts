import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { getCurrentUser } from '../services/auth'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        try {
          setUser(await getCurrentUser())
        } catch {
          setUser(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
