import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTreatNotes, addTreatNote, updateTreatNote, deleteTreatNote } from './treatNotes'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}))

import { supabase } from './supabase'

const mockSession = { data: { session: { user: { id: 'u1', user_metadata: { full_name: 'Owner' } } } }, error: null }

beforeEach(() => vi.clearAllMocks())

describe('getTreatNotes', () => {
  it('fetches treat notes ordered by date descending', async () => {
    const notes = [{ id: 'n1', name: 'Chicken jerky', liked: true }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: notes, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const result = await getTreatNotes('pet-1')
    expect(supabase.from).toHaveBeenCalledWith('treat_notes')
    expect(chain.order).toHaveBeenCalledWith('date', { ascending: false })
    expect(result).toEqual(notes)
  })

  it('throws when supabase returns error', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await expect(getTreatNotes('pet-1')).rejects.toThrow('db error')
  })
})

describe('addTreatNote', () => {
  it('inserts treat note with added_by owner', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'n1' }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await addTreatNote('pet-1', { name: 'Jerky', liked: true, where_bought: 'Zooplus', date: '2024-01-15', photo_url: null })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      pet_id: 'pet-1',
      name: 'Jerky',
      liked: true,
      added_by: expect.objectContaining({ type: 'owner', user_id: 'u1' }),
    }))
  })
})

describe('updateTreatNote', () => {
  it('updates treat note by id', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await updateTreatNote('n-1', { liked: false })
    expect(chain.update).toHaveBeenCalledWith({ liked: false })
    expect(chain.eq).toHaveBeenCalledWith('id', 'n-1')
  })

  it('throws when supabase returns error', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await expect(updateTreatNote('n-1', { liked: false })).rejects.toThrow('update failed')
  })
})

describe('deleteTreatNote', () => {
  it('deletes treat note by id', async () => {
    const chain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await deleteTreatNote('n-1')
    expect(supabase.from).toHaveBeenCalledWith('treat_notes')
    expect(chain.eq).toHaveBeenCalledWith('id', 'n-1')
  })

  it('throws when supabase returns error', async () => {
    const chain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'delete failed' } }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await expect(deleteTreatNote('n-1')).rejects.toThrow('delete failed')
  })
})
