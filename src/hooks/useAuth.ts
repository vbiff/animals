import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { getCurrentUser } from '../services/auth'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        setUser(await getCurrentUser())
      } catch {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
