import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentUser } from './auth'

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}))

import { supabase } from './supabase'

describe('getCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null }, error: null,
    } as never)
    expect(await getCurrentUser()).toBeNull()
  })

  it('returns user when session exists', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', name: 'A', avatar_url: null, created_at: '2024-01-01' }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } }, error: null,
    } as never)
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockUser, error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    expect(await getCurrentUser()).toEqual(mockUser)
  })
})
