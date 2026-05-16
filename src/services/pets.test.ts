import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPets, createPet } from './pets'

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
}))

import { supabase } from './supabase'

const mockSession = { data: { session: { user: { id: 'u1' } } }, error: null }
const mockPet = { id: 'p1', name: 'Rex', species: 'dog', breed: 'Lab', birth_date: '2020-01-01', photo_url: null, created_at: '2024-01-01' }

beforeEach(() => vi.clearAllMocks())

describe('getPets', () => {
  it('throws when not authenticated', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as never)
    await expect(getPets()).rejects.toThrow('Not authenticated')
  })

  it('returns pets', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [mockPet], error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    expect(await getPets()).toEqual([mockPet])
  })
})

describe('createPet', () => {
  it('inserts pet and creates owner row', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const petChain = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockPet, error: null }) }
    const ownerChain = { insert: vi.fn().mockResolvedValue({ data: null, error: null }) }
    vi.mocked(supabase.from).mockReturnValueOnce(petChain as never).mockReturnValueOnce(ownerChain as never)

    const result = await createPet({ name: 'Rex', species: 'dog', breed: 'Lab', birth_date: '2020-01-01' })
    expect(result).toEqual(mockPet)
    expect(ownerChain.insert).toHaveBeenCalledWith({ pet_id: 'p1', user_id: 'u1', invited_by: null })
  })
})
