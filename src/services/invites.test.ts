import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInvite, acceptInvite } from './invites'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}))

import { supabase } from './supabase'

const mockSession = { data: { session: { user: { id: 'u1' } } }, error: null }

beforeEach(() => vi.clearAllMocks())

describe('createInvite', () => {
  it('returns invite token', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const mockInvite = { id: 'i1', token: 'inv-tok', pet_id: 'p1', created_by: 'u1', accepted_by: null, expires_at: '', created_at: '' }
    const chain = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockInvite, error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const result = await createInvite('p1')
    expect(result.token).toBe('inv-tok')
  })
})

describe('acceptInvite', () => {
  it('throws for expired token', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await expect(acceptInvite('bad-token')).rejects.toThrow()
  })
})
