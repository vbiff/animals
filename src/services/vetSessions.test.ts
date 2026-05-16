import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVetSession } from './vetSessions'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}))

import { supabase } from './supabase'

beforeEach(() => vi.clearAllMocks())

describe('createVetSession', () => {
  it('throws when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as never)
    await expect(createVetSession('pet-1')).rejects.toThrow('Not authenticated')
  })

  it('inserts session and returns token', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } }, error: null,
    } as never)
    const mockSession = { id: 's1', token: 'tok-123', pet_id: 'pet-1', expires_at: '2024-01-01T00:00:00Z', created_by: 'u1', vet_name: null, vet_license: null }
    const chain = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockSession, error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await createVetSession('pet-1')
    expect(result.token).toBe('tok-123')
    expect(chain.insert).toHaveBeenCalledWith({ pet_id: 'pet-1', created_by: 'u1' })
  })
})
