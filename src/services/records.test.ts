import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRecords, addVaccine, updateSymptom, updateMedication } from './records'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}))

import { supabase } from './supabase'

const mockSession = { data: { session: { user: { id: 'u1', user_metadata: { full_name: 'Owner' } } } }, error: null }

beforeEach(() => vi.clearAllMocks())

describe('getRecords', () => {
  it('returns all records for a pet', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    const result = await getRecords('pet-1')
    expect(result).toEqual({ vaccines: [], symptoms: [], medications: [], documents: [] })
  })
})

describe('addVaccine', () => {
  it('inserts vaccine with added_by owner', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as never)
    const chain = { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'v1' }, error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await addVaccine('pet-1', { name: 'Rabies', date: '2024-01-01', next_date: null, document_url: null })
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      pet_id: 'pet-1',
      name: 'Rabies',
      added_by: expect.objectContaining({ type: 'owner', user_id: 'u1' }),
    }))
  })
})

describe('updateSymptom', () => {
  it('updates symptom fields by id', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await updateSymptom('s-1', { title: 'Cough', end_date: '2024-02-01' })
    expect(supabase.from).toHaveBeenCalledWith('symptoms')
    expect(chain.update).toHaveBeenCalledWith({ title: 'Cough', end_date: '2024-02-01' })
    expect(chain.eq).toHaveBeenCalledWith('id', 's-1')
  })

  it('throws when supabase returns error', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await expect(updateSymptom('s-1', { title: 'X' })).rejects.toThrow('fail')
  })
})

describe('updateMedication', () => {
  it('updates medication fields by id', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await updateMedication('m-1', { name: 'Ibuprofen', symptom_id: 's-1' })
    expect(supabase.from).toHaveBeenCalledWith('medications')
    expect(chain.update).toHaveBeenCalledWith({ name: 'Ibuprofen', symptom_id: 's-1' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'm-1')
  })
})
