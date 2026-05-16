import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(),
  },
}))

vi.mock('../services/auth', () => ({ getCurrentUser: vi.fn().mockResolvedValue(null) }))

describe('useAuth', () => {
  it('starts loading', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
  })

  it('sets loading false after resolution', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await Promise.resolve() })
    expect(result.current.loading).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
