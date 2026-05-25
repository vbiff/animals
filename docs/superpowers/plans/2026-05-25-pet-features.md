# Pet Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 new features to the Animals pet tracker: symptoms↔medications link, medication photo, edit mode for symptoms/medications, symptom end_date, chronological symptom sort, symptoms calendar tab, and treat notes tab.

**Architecture:** All changes are confined to the per-pet page and its services. DB migrations run first to unlock all new fields. New features follow the existing pattern: service function → Supabase call → typed return, components receive data as props from `useRecords`.

**Tech Stack:** React 18, TypeScript, Supabase (Postgres + Storage), Vite, i18next, Vitest

---

## File Map

**Modified:**
- `src/types/index.ts` — add `end_date` to Symptom, `symptom_id`+`photo_url` to Medication, add TreatNote
- `src/services/files.ts` — extend folder union type
- `src/services/records.ts` — fix symptom sort, add `updateSymptom`+`updateMedication`
- `src/hooks/useRecords.ts` — add treatNotes to state
- `src/i18n/ru.json`, `en.json`, `pt.json` — new keys
- `src/styles/components.css` — calendar + linked-meds styles
- `src/components/pet/SymptomsTab.tsx` — end_date, edit, linked medications
- `src/components/pet/MedicationsTab.tsx` — symptom dropdown, photo, edit
- `src/pages/PetPage.tsx` — add calendar + notes tabs, pass new props

**Created:**
- `src/services/treatNotes.ts` — CRUD for treat_notes table
- `src/services/treatNotes.test.ts` — service tests
- `src/components/pet/CalendarTab.tsx` — calendar view
- `src/components/pet/TreatNotesTab.tsx` — treat notes UI

---

## Task 1: Apply DB Migrations

**Files:**
- No local files — apply via Supabase dashboard or MCP tool

- [ ] **Step 1: Apply migration for symptoms table**

```sql
alter table symptoms add column end_date date;
```

- [ ] **Step 2: Apply migration for medications table**

```sql
alter table medications
  add column symptom_id uuid references symptoms(id) on delete set null,
  add column photo_url text;
```

- [ ] **Step 3: Create treat_notes table**

```sql
create table treat_notes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  name text not null,
  photo_url text,
  liked boolean not null,
  where_bought text,
  date date not null,
  added_by jsonb not null,
  created_at timestamptz not null default now()
);

alter table treat_notes enable row level security;

create policy "treat_notes_pet_access" on treat_notes
  using (
    pet_id in (
      select id from pets where created_by = auth.uid()
      union
      select pet_id from pet_co_owners where user_id = auth.uid()
    )
  );
```

> Note: Check existing RLS policy names on `symptoms`/`medications` tables and match the pattern exactly for `treat_notes`.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: apply db migrations for pet features"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `end_date` to Symptom, `symptom_id`+`photo_url` to Medication, add TreatNote**

Replace the `Symptom`, `Medication` interfaces and add `TreatNote` in `src/types/index.ts`:

```ts
export interface Symptom {
  id: string
  pet_id: string
  date: string
  end_date: string | null
  title: string
  description: string
  added_by: AddedBy
  created_at: string
}

export interface Medication {
  id: string
  pet_id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string | null
  symptom_id: string | null
  photo_url: string | null
  added_by: AddedBy
  created_at: string
}

export interface TreatNote {
  id: string
  pet_id: string
  name: string
  photo_url: string | null
  liked: boolean
  where_bought: string | null
  date: string
  added_by: AddedBy
  created_at: string
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to these types).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: update types for symptom end_date, medication photo/symptom_id, TreatNote"
```

---

## Task 3: Update files.ts and records.ts

**Files:**
- Modify: `src/services/files.ts`
- Modify: `src/services/records.ts`
- Modify: `src/services/records.test.ts`

- [ ] **Step 1: Write failing tests for new record service functions**

Add to `src/services/records.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRecords, addVaccine, updateSymptom, updateMedication } from './records'

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn() },
}))

import { supabase } from './supabase'

const mockSession = { data: { session: { user: { id: 'u1', user_metadata: { full_name: 'Owner' } } } }, error: null }

beforeEach(() => vi.clearAllMocks())

// --- existing tests stay unchanged ---

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/services/records.test.ts
```

Expected: FAIL — `updateSymptom` and `updateMedication` are not defined.

- [ ] **Step 3: Update `files.ts` to extend folder type**

In `src/services/files.ts`, change the `folder` parameter type on line 3:

```ts
export async function uploadFile(petId: string, folder: 'documents' | 'vaccines' | 'photos' | 'medications' | 'treats', file: File): Promise<string> {
```

- [ ] **Step 4: Update `records.ts`**

Replace the full content of `src/services/records.ts`:

```ts
import { supabase } from './supabase'
import type { AddedBy, Vaccine, Symptom, Medication, Document } from '../types'

async function ownerAddedBy(): Promise<AddedBy> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { type: 'owner', name: session.user.user_metadata.full_name ?? session.user.email ?? '', user_id: session.user.id }
}

async function fetchAll<T>(table: string, petId: string, orderBy = 'created_at'): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq('pet_id', petId).order(orderBy, { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

export async function getRecords(petId: string) {
  const [vaccines, symptoms, medications, documents] = await Promise.all([
    fetchAll<Vaccine>('vaccines', petId),
    fetchAll<Symptom>('symptoms', petId, 'date'),
    fetchAll<Medication>('medications', petId),
    fetchAll<Document>('documents', petId),
  ])
  return { vaccines, symptoms, medications, documents }
}

export async function addVaccine(petId: string, input: Omit<Vaccine, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Vaccine> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('vaccines').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Vaccine
}

export async function addSymptom(petId: string, input: Omit<Symptom, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Symptom> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('symptoms').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Symptom
}

export async function updateSymptom(id: string, input: Partial<Omit<Symptom, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('symptoms').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addMedication(petId: string, input: Omit<Medication, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Medication> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('medications').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Medication
}

export async function updateMedication(id: string, input: Partial<Omit<Medication, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('medications').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addDocument(petId: string, input: Omit<Document, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<Document> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('documents').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as Document
}

export async function deleteRecord(table: 'vaccines' | 'symptoms' | 'medications' | 'documents', id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/services/records.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/files.ts src/services/records.ts src/services/records.test.ts
git commit -m "feat: add updateSymptom, updateMedication, fix symptom chronological sort"
```

---

## Task 4: Create treatNotes Service

**Files:**
- Create: `src/services/treatNotes.ts`
- Create: `src/services/treatNotes.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/services/treatNotes.test.ts`:

```ts
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
})

describe('deleteTreatNote', () => {
  it('deletes treat note by id', async () => {
    const chain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
    await deleteTreatNote('n-1')
    expect(supabase.from).toHaveBeenCalledWith('treat_notes')
    expect(chain.eq).toHaveBeenCalledWith('id', 'n-1')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/services/treatNotes.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/services/treatNotes.ts`**

```ts
import { supabase } from './supabase'
import type { AddedBy, TreatNote } from '../types'

async function ownerAddedBy(): Promise<AddedBy> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { type: 'owner', name: session.user.user_metadata.full_name ?? session.user.email ?? '', user_id: session.user.id }
}

export async function getTreatNotes(petId: string): Promise<TreatNote[]> {
  const { data, error } = await supabase.from('treat_notes').select('*').eq('pet_id', petId).order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TreatNote[]
}

export async function addTreatNote(petId: string, input: Omit<TreatNote, 'id' | 'pet_id' | 'added_by' | 'created_at'>): Promise<TreatNote> {
  const added_by = await ownerAddedBy()
  const { data, error } = await supabase.from('treat_notes').insert({ ...input, pet_id: petId, added_by }).select().single()
  if (error) throw new Error(error.message)
  return data as TreatNote
}

export async function updateTreatNote(id: string, input: Partial<Omit<TreatNote, 'id' | 'pet_id' | 'added_by' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('treat_notes').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTreatNote(id: string): Promise<void> {
  const { error } = await supabase.from('treat_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/services/treatNotes.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/treatNotes.ts src/services/treatNotes.test.ts
git commit -m "feat: add treatNotes service with full CRUD"
```

---

## Task 5: Update useRecords Hook

**Files:**
- Modify: `src/hooks/useRecords.ts`

- [ ] **Step 1: Update hook to fetch and expose treatNotes**

Replace `src/hooks/useRecords.ts`:

```ts
import { useEffect, useState, useCallback } from 'react'
import { getRecords } from '../services/records'
import { getTreatNotes } from '../services/treatNotes'
import type { Vaccine, Symptom, Medication, Document, TreatNote } from '../types'

interface Records {
  vaccines: Vaccine[]
  symptoms: Symptom[]
  medications: Medication[]
  documents: Document[]
  treatNotes: TreatNote[]
}

export function useRecords(petId: string) {
  const [records, setRecords] = useState<Records>({
    vaccines: [], symptoms: [], medications: [], documents: [], treatNotes: [],
  })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [base, treatNotes] = await Promise.all([getRecords(petId), getTreatNotes(petId)])
      setRecords({ ...base, treatNotes })
    } finally { setLoading(false) }
  }, [petId])

  useEffect(() => { refresh() }, [refresh])

  return { records, loading, refresh }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRecords.ts
git commit -m "feat: extend useRecords to include treatNotes"
```

---

## Task 6: Add i18n Strings

**Files:**
- Modify: `src/i18n/ru.json`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/pt.json`

- [ ] **Step 1: Update `ru.json`**

Add these keys (merge into existing objects — do not replace the whole file):

```json
{
  "symptom": {
    "end_date": "Дата выздоровления (необязательно)",
    "linked_medications": "Лекарства при этом симптоме"
  },
  "medication": {
    "symptom_none": "Без симптома",
    "symptom": "При симптоме (необязательно)",
    "photo": "Фото упаковки (необязательно)",
    "treats": "Лечит"
  },
  "pet": {
    "calendar": "Календарь",
    "notes": "Заметки"
  },
  "treat": {
    "name": "Название",
    "liked": "Понравилось",
    "disliked": "Не понравилось",
    "where_bought": "Где купила (необязательно)",
    "photo": "Фото (необязательно)",
    "add": "Добавить заметку"
  },
  "common": {
    "save_changes": "Сохранить изменения",
    "edit": "Изменить"
  }
}
```

- [ ] **Step 2: Update `en.json`**

```json
{
  "symptom": {
    "end_date": "Recovery date (optional)",
    "linked_medications": "Medications for this symptom"
  },
  "medication": {
    "symptom_none": "No symptom",
    "symptom": "For symptom (optional)",
    "photo": "Package photo (optional)",
    "treats": "Treats"
  },
  "pet": {
    "calendar": "Calendar",
    "notes": "Notes"
  },
  "treat": {
    "name": "Name",
    "liked": "Liked",
    "disliked": "Disliked",
    "where_bought": "Where bought (optional)",
    "photo": "Photo (optional)",
    "add": "Add note"
  },
  "common": {
    "save_changes": "Save changes",
    "edit": "Edit"
  }
}
```

- [ ] **Step 3: Update `pt.json`**

```json
{
  "symptom": {
    "end_date": "Data de recuperação (opcional)",
    "linked_medications": "Medicamentos para este sintoma"
  },
  "medication": {
    "symptom_none": "Sem sintoma",
    "symptom": "Para sintoma (opcional)",
    "photo": "Foto da embalagem (opcional)",
    "treats": "Trata"
  },
  "pet": {
    "calendar": "Calendário",
    "notes": "Notas"
  },
  "treat": {
    "name": "Nome",
    "liked": "Gostou",
    "disliked": "Não gostou",
    "where_bought": "Onde comprou (opcional)",
    "photo": "Foto (opcional)",
    "add": "Adicionar nota"
  },
  "common": {
    "save_changes": "Guardar alterações",
    "edit": "Editar"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ru.json src/i18n/en.json src/i18n/pt.json
git commit -m "feat: add i18n strings for new pet features"
```

---

## Task 7: Add CSS Styles

**Files:**
- Modify: `src/styles/components.css`

- [ ] **Step 1: Add calendar and linked-meds styles to end of `components.css`**

```css
/* Calendar */

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-line);
  text-transform: uppercase;
  font-size: var(--text-size-sm);
  letter-spacing: var(--text-tracking-wide);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-top: 12px;
}

.calendar-dow {
  padding: 6px 0;
  text-align: center;
  font-size: var(--text-size-xs);
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--text-tracking-wide);
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-size-sm);
  color: var(--color-ink-muted);
  position: relative;
}

.calendar-day.has-symptom {
  color: var(--color-ink);
  font-weight: 500;
  cursor: pointer;
}

.calendar-day.has-symptom::after {
  content: "";
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-ink);
}

.calendar-day.is-selected {
  background: var(--bg-surface-muted);
  outline: 1px solid var(--color-line);
}

/* Linked medications in symptom cards */

.linked-meds {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-line);
}

.linked-meds small {
  color: var(--color-ink-muted);
  font-size: var(--text-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--text-tracking-wide);
}

.linked-meds ul {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
}

.linked-meds li {
  font-size: var(--text-size-sm);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/components.css
git commit -m "feat: add calendar and linked-meds CSS"
```

---

## Task 8: Update SymptomsTab

**Files:**
- Modify: `src/components/pet/SymptomsTab.tsx`

- [ ] **Step 1: Replace full component**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addSymptom, updateSymptom, deleteRecord } from '../../services/records'
import type { Symptom, Medication } from '../../types'

interface Props {
  petId: string
  symptoms: Symptom[]
  medications: Medication[]
  onRefresh: () => void
}

const emptyForm = { title: '', date: '', end_date: '', description: '' }

export function SymptomsTab({ petId, symptoms, medications, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  function set(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function startEdit(s: Symptom) {
    setForm({ title: s.title, date: s.date, end_date: s.end_date ?? '', description: s.description })
    setEditingId(s.id)
    setShowForm(true)
  }

  function cancelEdit() {
    setForm(emptyForm); setEditingId(null); setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { title: form.title, date: form.date, end_date: form.end_date || null, description: form.description }
    if (editingId) {
      await updateSymptom(editingId, payload)
    } else {
      await addSymptom(petId, payload)
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false)
    onRefresh()
  }

  function linkedMeds(symptomId: string) {
    return medications.filter(m => m.symptom_id === symptomId)
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {t('symptom.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('symptom.title')} value={form.title} onChange={set('title')} required />
          <input type="date" value={form.date} onChange={set('date')} required />
          <input type="date" placeholder={t('symptom.end_date')} value={form.end_date} onChange={set('end_date')} />
          <textarea placeholder={t('symptom.description')} value={form.description} onChange={set('description')} rows={3} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editingId ? t('common.save_changes') : t('common.save')}</button>
            {editingId && (
              <button type="button" className="button-secondary" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      )}
      <ul className="record-list">
        {symptoms.map(s => {
          const meds = linkedMeds(s.id)
          return (
            <li key={s.id} className="record-item">
              <div>
                <strong>{s.title}</strong>
                <p className="record-meta">
                  {s.date}{s.end_date ? ` — ${s.end_date}` : ''}
                </p>
                {s.description && <p>{s.description}</p>}
                {meds.length > 0 && (
                  <div className="linked-meds">
                    <small>{t('symptom.linked_medications')}</small>
                    <ul>
                      {meds.map(m => <li key={m.id}>{m.name} · {m.dosage}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button-secondary" onClick={() => startEdit(s)}>{t('common.edit')}</button>
                <button className="button-secondary" onClick={() => deleteRecord('symptoms', s.id).then(onRefresh)}>{t('common.delete')}</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pet/SymptomsTab.tsx
git commit -m "feat: update SymptomsTab with end_date, edit mode, and linked medications"
```

---

## Task 9: Update MedicationsTab

**Files:**
- Modify: `src/components/pet/MedicationsTab.tsx`

- [ ] **Step 1: Replace full component**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addMedication, updateMedication, deleteRecord } from '../../services/records'
import { uploadFile } from '../../services/files'
import type { Medication, Symptom } from '../../types'

interface Props {
  petId: string
  medications: Medication[]
  symptoms: Symptom[]
  onRefresh: () => void
}

const emptyForm = { name: '', dosage: '', frequency: '', start_date: '', end_date: '', symptom_id: '', photo_url: '' }

export function MedicationsTab({ petId, medications, symptoms, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  function startEdit(m: Medication) {
    setForm({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      start_date: m.start_date,
      end_date: m.end_date ?? '',
      symptom_id: m.symptom_id ?? '',
      photo_url: m.photo_url ?? '',
    })
    setEditingId(m.id)
    setPhotoFile(null)
    setShowForm(true)
  }

  function cancelEdit() {
    setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let photoUrl: string | null = form.photo_url || null
    if (photoFile) {
      photoUrl = await uploadFile(petId, 'medications', photoFile)
    }
    const payload = {
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
      symptom_id: form.symptom_id || null,
      photo_url: photoUrl,
    }
    if (editingId) {
      await updateMedication(editingId, payload)
    } else {
      await addMedication(petId, payload)
    }
    setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
    onRefresh()
  }

  function linkedSymptom(m: Medication) {
    return symptoms.find(s => s.id === m.symptom_id)
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {t('medication.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('medication.name')} value={form.name} onChange={set('name')} required />
          <input placeholder={t('medication.dosage')} value={form.dosage} onChange={set('dosage')} required />
          <input placeholder={t('medication.frequency')} value={form.frequency} onChange={set('frequency')} required />
          <input type="date" placeholder={t('medication.start_date')} value={form.start_date} onChange={set('start_date')} required />
          <input type="date" placeholder={t('medication.end_date')} value={form.end_date} onChange={set('end_date')} />
          <select value={form.symptom_id} onChange={set('symptom_id')}>
            <option value="">{t('medication.symptom_none')}</option>
            {symptoms.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.date})</option>
            ))}
          </select>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-ink-muted)', fontSize: 'var(--text-size-sm)' }}>
              {t('medication.photo')}
            </label>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
            {form.photo_url && !photoFile && (
              <img src={form.photo_url} alt="" style={{ marginTop: 8, width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editingId ? t('common.save_changes') : t('common.save')}</button>
            {editingId && (
              <button type="button" className="button-secondary" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      )}
      <ul className="record-list">
        {medications.map(m => {
          const sym = linkedSymptom(m)
          return (
            <li key={m.id} className="record-item">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                {m.photo_url && (
                  <img src={m.photo_url} alt={m.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                )}
                <div>
                  <strong>{m.name}</strong>
                  <p>{m.dosage} · {m.frequency}</p>
                  <small className="record-meta">{m.start_date}{m.end_date ? ` - ${m.end_date}` : ''}</small>
                  {sym && <p className="record-meta">{t('medication.treats')}: {sym.title}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="button-secondary" onClick={() => startEdit(m)}>{t('common.edit')}</button>
                <button className="button-secondary" onClick={() => deleteRecord('medications', m.id).then(onRefresh)}>{t('common.delete')}</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pet/MedicationsTab.tsx
git commit -m "feat: update MedicationsTab with symptom link, photo upload, and edit mode"
```

---

## Task 10: Create CalendarTab

**Files:**
- Create: `src/components/pet/CalendarTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Symptom } from '../../types'

interface Props { symptoms: Symptom[] }

export function CalendarTab({ symptoms }: Props) {
  const { i18n } = useTranslation()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const symptomsByDate = symptoms.reduce<Record<string, Symptom[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {})

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const locale = i18n.language
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1))

  // Week starting Sunday: 2024-01-07 is a Sunday
  const dowLabels = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + i))
  )

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedSymptoms = selectedDate ? (symptomsByDate[selectedDate] ?? []) : []

  return (
    <div className="record-panel">
      <div className="calendar-nav">
        <button className="button-secondary" onClick={prevMonth}>←</button>
        <strong>{monthLabel}</strong>
        <button className="button-secondary" onClick={nextMonth}>→</button>
      </div>
      <div className="calendar-grid">
        {dowLabels.map(d => <div key={d} className="calendar-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = toDateStr(day)
          const hasSymptom = !!symptomsByDate[dateStr]
          const isSelected = selectedDate === dateStr
          return (
            <div
              key={dateStr}
              className={`calendar-day${hasSymptom ? ' has-symptom' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => hasSymptom && setSelectedDate(isSelected ? null : dateStr)}
            >
              {day}
            </div>
          )
        })}
      </div>
      {selectedSymptoms.length > 0 && (
        <ul className="record-list">
          {selectedSymptoms.map(s => (
            <li key={s.id} className="record-item" style={{ gridTemplateColumns: '1fr' }}>
              <div>
                <strong>{s.title}</strong>
                <p className="record-meta">{s.date}{s.end_date ? ` — ${s.end_date}` : ''}</p>
                {s.description && <p>{s.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pet/CalendarTab.tsx
git commit -m "feat: add CalendarTab with symptom highlighting"
```

---

## Task 11: Create TreatNotesTab

**Files:**
- Create: `src/components/pet/TreatNotesTab.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addTreatNote, updateTreatNote, deleteTreatNote } from '../../services/treatNotes'
import { uploadFile } from '../../services/files'
import type { TreatNote } from '../../types'

interface Props {
  petId: string
  treatNotes: TreatNote[]
  onRefresh: () => void
}

const emptyForm = { name: '', liked: true, where_bought: '', date: '' }

export function TreatNotesTab({ petId, treatNotes, onRefresh }: Props) {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ name: string; liked: boolean; where_bought: string; date: string }>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  function setStr(k: 'name' | 'where_bought' | 'date') {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function startEdit(n: TreatNote) {
    setForm({ name: n.name, liked: n.liked, where_bought: n.where_bought ?? '', date: n.date })
    setEditingId(n.id)
    setPhotoFile(null)
    setShowForm(true)
  }

  function cancelEdit() {
    setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const existingPhotoUrl = editingId
      ? (treatNotes.find(n => n.id === editingId)?.photo_url ?? null)
      : null
    const photoUrl = photoFile
      ? await uploadFile(petId, 'treats', photoFile)
      : existingPhotoUrl
    const payload = {
      name: form.name,
      liked: form.liked,
      where_bought: form.where_bought || null,
      date: form.date,
      photo_url: photoUrl,
    }
    if (editingId) {
      await updateTreatNote(editingId, payload)
    } else {
      await addTreatNote(petId, payload)
    }
    setForm(emptyForm); setEditingId(null); setPhotoFile(null); setShowForm(false)
    onRefresh()
  }

  return (
    <div className="record-panel">
      <button onClick={() => { if (editingId) { cancelEdit() } else { setShowForm(v => !v) } }}>
        {t('treat.add')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="record-form">
          <input placeholder={t('treat.name')} value={form.name} onChange={setStr('name')} required />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`tab-button${form.liked ? ' is-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, liked: true }))}
            >
              👍 {t('treat.liked')}
            </button>
            <button
              type="button"
              className={`tab-button${!form.liked ? ' is-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, liked: false }))}
            >
              👎 {t('treat.disliked')}
            </button>
          </div>
          <input placeholder={t('treat.where_bought')} value={form.where_bought} onChange={setStr('where_bought')} />
          <input type="date" value={form.date} onChange={setStr('date')} required />
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--color-ink-muted)', fontSize: 'var(--text-size-sm)' }}>
              {t('treat.photo')}
            </label>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">{editingId ? t('common.save_changes') : t('common.save')}</button>
            {editingId && (
              <button type="button" className="button-secondary" onClick={cancelEdit}>{t('common.cancel')}</button>
            )}
          </div>
        </form>
      )}
      <ul className="record-list">
        {treatNotes.map(n => (
          <li key={n.id} className="record-item">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              {n.photo_url && (
                <img src={n.photo_url} alt={n.name}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div>
                <strong>{n.name} {n.liked ? '👍' : '👎'}</strong>
                {n.where_bought && <p className="record-meta">{n.where_bought}</p>}
                <small className="record-meta">{n.date}</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="button-secondary" onClick={() => startEdit(n)}>{t('common.edit')}</button>
              <button className="button-secondary" onClick={() => deleteTreatNote(n.id).then(onRefresh)}>{t('common.delete')}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pet/TreatNotesTab.tsx
git commit -m "feat: add TreatNotesTab with photo, liked/disliked, and edit"
```

---

## Task 12: Update PetPage

**Files:**
- Modify: `src/pages/PetPage.tsx`

- [ ] **Step 1: Replace full PetPage**

```tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePet } from '../hooks/usePet'
import { useRecords } from '../hooks/useRecords'
import { PetHeader } from '../components/pet/PetHeader'
import { VaccinesTab } from '../components/pet/VaccinesTab'
import { SymptomsTab } from '../components/pet/SymptomsTab'
import { MedicationsTab } from '../components/pet/MedicationsTab'
import { DocumentsTab } from '../components/pet/DocumentsTab'
import { CalendarTab } from '../components/pet/CalendarTab'
import { TreatNotesTab } from '../components/pet/TreatNotesTab'
import { VetSessionModal, InviteModal } from '../components/pet/VetSessionModal'

type TabId = 'vaccines' | 'symptoms' | 'medications' | 'documents' | 'calendar' | 'notes'

const TAB_LABEL_KEYS: Record<TabId, string> = {
  vaccines: 'pet.vaccines',
  symptoms: 'pet.symptoms',
  medications: 'pet.medications',
  documents: 'pet.documents',
  calendar: 'pet.calendar',
  notes: 'pet.notes',
}

export function PetPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pet, loading, error } = usePet(id!)
  const { records, refresh } = useRecords(id!)
  const [tab, setTab] = useState<TabId>('vaccines')
  const [showVetModal, setShowVetModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  if (loading) return <div className="loading-state">{t('common.loading')}</div>
  if (error || !pet) { navigate('/dashboard'); return null }

  const tabs: TabId[] = ['vaccines', 'symptoms', 'medications', 'documents', 'calendar', 'notes']

  return (
    <div>
      <PetHeader pet={pet} onOpenForVet={() => setShowVetModal(true)} onInvite={() => setShowInviteModal(true)} />
      <div className="tabs">
        {tabs.map(tabId => (
          <button
            key={tabId}
            className={`tab-button${tab === tabId ? ' is-active' : ''}`}
            onClick={() => setTab(tabId)}
          >
            {t(TAB_LABEL_KEYS[tabId])}
          </button>
        ))}
      </div>
      <div className="page-pad">
        {tab === 'vaccines' && (
          <VaccinesTab petId={id!} vaccines={records.vaccines} onRefresh={refresh} />
        )}
        {tab === 'symptoms' && (
          <SymptomsTab petId={id!} symptoms={records.symptoms} medications={records.medications} onRefresh={refresh} />
        )}
        {tab === 'medications' && (
          <MedicationsTab petId={id!} medications={records.medications} symptoms={records.symptoms} onRefresh={refresh} />
        )}
        {tab === 'documents' && (
          <DocumentsTab petId={id!} documents={records.documents} onRefresh={refresh} />
        )}
        {tab === 'calendar' && (
          <CalendarTab symptoms={records.symptoms} />
        )}
        {tab === 'notes' && (
          <TreatNotesTab petId={id!} treatNotes={records.treatNotes} onRefresh={refresh} />
        )}
      </div>
      {showVetModal && <VetSessionModal petId={id!} onClose={() => setShowVetModal(false)} />}
      {showInviteModal && <InviteModal petId={id!} onClose={() => setShowInviteModal(false)} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PetPage.tsx
git commit -m "feat: add calendar and notes tabs to PetPage, wire new component props"
```

---

## Task 13: Manual QA Checklist

Start the dev server:

```bash
npm run dev
```

- [ ] Symptoms tab: add symptom with end_date → card shows date range
- [ ] Symptoms tab: symptoms appear newest-first by date
- [ ] Symptoms tab: edit a symptom → form pre-fills → save updates in place
- [ ] Medications tab: add medication linked to a symptom → symptom card shows linked medication
- [ ] Medications tab: add medication with photo → thumbnail shows in card
- [ ] Medications tab: edit a medication → form pre-fills including existing photo
- [ ] Calendar tab: navigate months, symptom days have dot indicator, click day shows symptoms
- [ ] Notes tab: add treat note with 👍/👎, where bought, photo → shows correctly in list
- [ ] Notes tab: edit and delete treat note
- [ ] Switch app language (EN/PT) → all new strings translate correctly
